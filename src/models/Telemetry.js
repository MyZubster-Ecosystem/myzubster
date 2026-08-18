const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  robotId: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['sensor', 'status', 'position', 'diagnostic', 'event'],
    default: 'sensor'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Common numeric fields for range validation
  temperature: {
    type: Number,
    min: -100,
    max: 500
  },
  battery: {
    type: Number,
    min: 0,
    max: 100
  },
  lat: {
    type: Number,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    min: -180,
    max: 180
  },
  status: {
    type: String,
    enum: ['ok', 'warning', 'error', 'offline'],
    default: 'ok'
  },
  receivedAt: {
    type: Date,
    default: Date.now
  }
});

TelemetrySchema.index({ robotId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', TelemetrySchema);
