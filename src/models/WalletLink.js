const mongoose = require('mongoose');

const WalletLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  networkFamily: {
    type: String,
    enum: ['EVM'],
    default: 'EVM'
  },
  status: {
    type: String,
    enum: ['VERIFIED', 'DISCONNECTED'],
    default: 'VERIFIED'
  },
  verifiedAt: Date,
  lastVerifiedAt: Date,
  disconnectedAt: Date
}, { timestamps: true });

WalletLinkSchema.index(
  { userId: 1, walletAddress: 1 },
  { unique: true }
);

WalletLinkSchema.index(
  { walletAddress: 1 },
  { unique: true }
);

module.exports = mongoose.model('WalletLink', WalletLinkSchema);
