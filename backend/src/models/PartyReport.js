const mongoose = require('mongoose');

const partyReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  reporterUserId: { type: String, required: true, index: true },
  worldId: { type: String, required: true, default: 'neon-plaza', index: true },
  targetType: { type: String, required: true, enum: ['user', 'message', 'session', 'room'] },
  targetId: { type: String, required: true },
  reason: { type: String, required: true, enum: ['spam', 'harassment', 'unsafe-content', 'impersonation', 'other'] },
  details: { type: String, default: '' },
  status: { type: String, required: true, enum: ['open', 'reviewed', 'escalated', 'dismissed'], default: 'open', index: true },
  reviewedByUserId: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true, minimize: true });

partyReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
partyReportSchema.index({ worldId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.PartyReport
  || mongoose.model('PartyReport', partyReportSchema);
