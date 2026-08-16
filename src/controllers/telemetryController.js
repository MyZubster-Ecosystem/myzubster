const Telemetry = require('../models/Telemetry');

// In-memory fallback store (used when MongoDB is unavailable)
let memStore = [];

function isMongoConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

/**
 * POST /api/telemetry
 * Submit a telemetry reading from a robot/device
 */
exports.submit = async (req, res) => {
  try {
    const { robotId, deviceId, type, payload, temperature, battery, lat, lng, status } = req.body;

    // Required field validation
    if (!robotId || typeof robotId !== 'string' || !robotId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'robotId is required and must be a non-empty string'
      });
    }

    if (payload === undefined || payload === null) {
      return res.status(400).json({
        success: false,
        message: 'payload is required'
      });
    }

    // Numeric range validation
    if (temperature !== undefined && (temperature < -100 || temperature > 500)) {
      return res.status(400).json({
        success: false,
        message: 'temperature must be between -100 and 500'
      });
    }

    if (battery !== undefined && (battery < 0 || battery > 100)) {
      return res.status(400).json({
        success: false,
        message: 'battery must be between 0 and 100'
      });
    }

    if (lat !== undefined && (lat < -90 || lat > 90)) {
      return res.status(400).json({
        success: false,
        message: 'lat must be between -90 and 90'
      });
    }

    if (lng !== undefined && (lng < -180 || lng > 180)) {
      return res.status(400).json({
        success: false,
        message: 'lng must be between -180 and 180'
      });
    }

    const validTypes = ['sensor', 'status', 'position', 'diagnostic', 'event'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${validTypes.join(', ')}`
      });
    }

    const validStatuses = ['ok', 'warning', 'error', 'offline'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const doc = {
      robotId: robotId.trim(),
      deviceId: deviceId ? String(deviceId).trim() : undefined,
      type: type || 'sensor',
      payload,
      temperature,
      battery,
      lat,
      lng,
      status: status || 'ok',
      timestamp: new Date(),
      receivedAt: new Date()
    };

    let saved;
    if (isMongoConnected()) {
      const entry = new Telemetry(doc);
      saved = await entry.save();
    } else {
      // In-memory fallback for MVP/test environments
      const entry = { ...doc, _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}` };
      memStore.push(entry);
      if (memStore.length > 1000) memStore = memStore.slice(-1000);
      saved = entry;
    }

    return res.status(201).json({
      success: true,
      message: 'Telemetry recorded',
      data: {
        id: saved._id,
        robotId: saved.robotId,
        type: saved.type,
        status: saved.status,
        timestamp: saved.timestamp,
        receivedAt: saved.receivedAt
      }
    });

  } catch (error) {
    console.error('Telemetry submit error:', error);

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/telemetry
 * Retrieve telemetry readings
 * Query params: robotId, type, status, limit (default 50), skip (default 0)
 */
exports.list = async (req, res) => {
  try {
    const { robotId, type, status, limit = 50, skip = 0 } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const parsedSkip = Math.max(parseInt(skip, 10) || 0, 0);

    let result;

    if (isMongoConnected()) {
      const filter = {};
      if (robotId) filter.robotId = robotId;
      if (type) filter.type = type;
      if (status) filter.status = status;

      const [data, total] = await Promise.all([
        Telemetry.find(filter)
          .sort({ timestamp: -1 })
          .skip(parsedSkip)
          .limit(parsedLimit)
          .lean(),
        Telemetry.countDocuments(filter)
      ]);

      result = { data, total };
    } else {
      // In-memory fallback
      let data = [...memStore];
      if (robotId) data = data.filter(e => e.robotId === robotId);
      if (type) data = data.filter(e => e.type === type);
      if (status) data = data.filter(e => e.status === status);
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const total = data.length;
      data = data.slice(parsedSkip, parsedSkip + parsedLimit);
      result = { data, total };
    }

    return res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        limit: parsedLimit,
        skip: parsedSkip,
        returned: result.data.length
      }
    });

  } catch (error) {
    console.error('Telemetry list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
