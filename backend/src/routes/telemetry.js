const express = require('express');
const Telemetry = require('../models/Telemetry');

const router = express.Router();

const REQUIRED_FIELDS = ['robotId', 'temperature', 'humidity', 'battery'];

const NUMERIC_RANGES = {
  temperature: { min: -50, max: 150 },
  humidity: { min: 0, max: 100 },
  battery: { min: 0, max: 100 },
  cpuTemperature: { min: -20, max: 150 },
  signalStrength: { min: -200, max: 100 },
};

function validateSample(body) {
  const errors = [];
  for (const key of REQUIRED_FIELDS) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      errors.push(key + ' is required');
    }
  }
  for (const key of Object.keys(NUMERIC_RANGES)) {
    if (body[key] !== undefined && body[key] !== null) {
      const value = Number(body[key]);
      if (!Number.isFinite(value)) {
        errors.push(key + ' must be numeric');
      } else if (value < NUMERIC_RANGES[key].min || value > NUMERIC_RANGES[key].max) {
        errors.push(key + ' must be between ' + NUMERIC_RANGES[key].min + ' and ' + NUMERIC_RANGES[key].max);
      }
    }
  }
  if (body.timestamp !== undefined && body.timestamp !== null && body.timestamp !== '') {
    const timestamp = new Date(body.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      errors.push('timestamp must be a valid date');
    }
  }
  return errors;
}

// POST /api/telemetry - submit a telemetry sample
router.post('/', async (req, res) => {
  const body = req.body || {};
  const errors = validateSample(body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Invalid telemetry', details: errors });
  }
  try {
    const sample = await Telemetry.create({
      robotId: String(body.robotId),
      temperature: Number(body.temperature),
      humidity: Number(body.humidity),
      battery: Number(body.battery),
      cpuTemperature: body.cpuTemperature != null ? Number(body.cpuTemperature) : null,
      signalStrength: body.signalStrength != null ? Number(body.signalStrength) : null,
      status: body.status || 'idle',
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      source: body.source || 'api',
    });
    return res.status(201).json({ success: true, data: sample });
  } catch (error) {
    console.error('Telemetry store error:', error);
    return res.status(500).json({ success: false, error: 'Unable to store telemetry' });
  }
});

// GET /api/telemetry - retrieve telemetry (optionally filtered by robotId)
router.get('/', async (req, res) => {
  const { robotId, limit, sort } = req.query;
  const query = {};
  if (robotId) query.robotId = robotId;
  const maxLimit = Math.min(Number(limit) || 50, 500);
  const sortOrder = sort === 'asc' ? 1 : -1;
  try {
    const samples = await Telemetry.find(query).sort({ timestamp: sortOrder }).limit(maxLimit);
    const latest = await Telemetry.find(query).sort({ timestamp: -1 }).limit(1);
    return res.json({ success: true, count: samples.length, latest: latest[0] || null, data: samples });
  } catch (error) {
    console.error('Telemetry read error:', error);
    return res.status(500).json({ success: false, error: 'Unable to read telemetry' });
  }
});

module.exports = router;
