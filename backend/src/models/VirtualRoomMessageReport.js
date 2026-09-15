const mongoose = require('mongoose');

const virtualRoomMessageReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  messageId: { type: String, required: true, index: true },
  reporterUserId: { type: String, required: true, select: false },
  reason: { type: String, enum: ['spam', 'harassment', 'unsafe', 'other'], required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  resolvedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

virtualRoomMessageReportSchema.index({ sessionId: 1, messageId: 1, reporterUserId: 1 }, { unique: true });
virtualRoomMessageReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.VirtualRoomMessageReport
  || mongoose.model('VirtualRoomMessageReport', virtualRoomMessageReportSchema);
