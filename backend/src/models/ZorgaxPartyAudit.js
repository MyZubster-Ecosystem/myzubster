const mongoose = require('mongoose');

const zorgaxPartyAuditSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true, index: true },
  actorUserId: { type: String, required: true, index: true },
  actorRole: { type: String, required: true },
  command: { type: String, required: true, index: true },
  idempotencyKey: { type: String, required: true, index: true },
  outcome: { type: String, required: true, enum: ['executed', 'rejected', 'duplicate'] },
  resourceType: { type: String, default: null },
  resourceId: { type: String, default: null },
  reason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
}, { versionKey: false });

zorgaxPartyAuditSchema.index({ actorUserId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.models.ZorgaxPartyAudit
  || mongoose.model('ZorgaxPartyAudit', zorgaxPartyAuditSchema);
