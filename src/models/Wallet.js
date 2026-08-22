const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: { type: String, required: true, lowercase: true, index: true },
  chainId: { type: Number, required: true },
  verified: { type: Boolean, default: false, index: true },
  challengeNonce: { type: String, default: null },
  challengeExpiresAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  lastSignature: { type: String, default: null }
}, { timestamps: true });

walletSchema.index({ userId: 1, address: 1, chainId: 1 }, { unique: true });

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
