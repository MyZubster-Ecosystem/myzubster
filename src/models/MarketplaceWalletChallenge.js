'use strict';

const mongoose = require('mongoose');

const marketplaceWalletChallengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['MARKETPLACE_REQUEST'], required: true, index: true },
  walletAddress: { type: String, required: true, trim: true, index: true },
  chainId: { type: Number, required: true, min: 1 },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  quantity: { type: Number, required: true, min: 1, max: 1000 },
  payload: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
  payloadHash: { type: String, required: true, index: true },
  message: { type: String, required: true, select: false },
  messageHash: { type: String, required: true },
  nonceHash: { type: String, required: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

marketplaceWalletChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
marketplaceWalletChallengeSchema.index({ userId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.models.MarketplaceWalletChallenge
  || mongoose.model('MarketplaceWalletChallenge', marketplaceWalletChallengeSchema);
