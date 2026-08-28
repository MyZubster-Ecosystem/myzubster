const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  worldId: { type: String, enum: ['decentraland', 'sandbox'], required: true, index: true },
  address: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
  network: { type: String, required: true, trim: true, maxlength: 80 },
  tokenSymbol: { type: String, required: true, trim: true, maxlength: 16 },
  verifiedAt: { type: Date, default: null },
  verificationMethod: { type: String, enum: ['wallet-signature'], default: 'wallet-signature' },
  challengeNonce: { type: String, default: null, select: false },
  challengeExpiresAt: { type: Date, default: null, select: false },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

schema.index({ userId: 1, worldId: 1 }, { unique: true });
schema.index({ worldId: 1, address: 1 }, { unique: true });
module.exports = mongoose.models.MetaverseWalletLink || mongoose.model('MetaverseWalletLink', schema);
