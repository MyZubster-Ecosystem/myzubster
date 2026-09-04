const mongoose = require('mongoose');

const onionTelemetryHeartbeatSchema = new mongoose.Schema({
  bucket: { type: String, required: true, unique: true, index: true, minlength: 16, maxlength: 64 },
  release: { type: String, default: null, maxlength: 64 },
  runtime: { type: String, required: true, enum: ['docker'] },
  lastSeenAt: { type: Date, required: true, default: Date.now, index: true },
  expiresAt: { type: Date, required: true }
}, {
  versionKey: false,
  minimize: true
});

onionTelemetryHeartbeatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.OnionTelemetryHeartbeat
  || mongoose.model('OnionTelemetryHeartbeat', onionTelemetryHeartbeatSchema);
