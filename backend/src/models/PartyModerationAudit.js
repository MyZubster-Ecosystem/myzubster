const mongoose = require('mongoose');

const partyModerationAuditSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true, index: true },
  reportId: { type: String, required: true, index: true },
  moderatorUserId: { type: String, required: true, index: true },
  action: { type: String, required: true, enum: ['mark-reviewed', 'escalate', 'dismiss'] },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  note: { type: String, default: '' },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true, minimize: true });

partyModerationAuditSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
partyModerationAuditSchema.index({ reportId: 1, createdAt: -1 });

module.exports = mongoose.models.PartyModerationAudit
  || mongoose.model('PartyModerationAudit', partyModerationAuditSchema);
