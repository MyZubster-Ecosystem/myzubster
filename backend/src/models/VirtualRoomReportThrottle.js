const mongoose = require('mongoose');

const virtualRoomReportThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, required: true, default: 0, min: 0 },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

virtualRoomReportThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.VirtualRoomReportThrottle
  || mongoose.model('VirtualRoomReportThrottle', virtualRoomReportThrottleSchema);
