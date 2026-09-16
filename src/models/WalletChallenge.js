const mongoose = require('mongoose');

const WalletChallengeSchema = new mongoose.Schema({
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
  nonce: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    enum: ['LINK_WALLET'],
    default: 'LINK_WALLET'
  },
  message: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  usedAt: Date
}, { timestamps: true });

module.exports = mongoose.model(
  'WalletChallenge',
  WalletChallengeSchema
);
