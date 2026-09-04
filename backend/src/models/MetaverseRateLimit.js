const mongoose = require('mongoose');

const metaverseRateLimitSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  worldId: { type: String, required: true, default: 'neon-plaza', index: true },
  action: { type: String, required: true, trim: true, maxlength: 48, index: true },
  subjectHash: { type: String, required: true, trim: true, maxlength: 64 },
  count: { type: Number, required: true, default: 0, min: 0 },
  windowStartedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

metaverseRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.MetaverseRateLimit
  || mongoose.model('MetaverseRateLimit', metaverseRateLimitSchema);
