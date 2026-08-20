const mongoose = require('mongoose');

const ZorgaxMemorySchema = new mongoose.Schema({
  entityId: { type: String, default: 'ZORGAX-001', index: true },
  ownerHash: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['interaction', 'observation', 'decision'],
    default: 'interaction'
  },
  claimClass: {
    type: String,
    enum: ['verified', 'uncertain', 'speculative', 'fictional'],
    default: 'uncertain'
  },
  content: { type: String, required: true, maxlength: 1000 },
  source: { type: String, default: 'user_opt_in', maxlength: 120 },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

ZorgaxMemorySchema.index({ ownerHash: 1, createdAt: -1 });

module.exports = mongoose.model('ZorgaxMemory', ZorgaxMemorySchema);
