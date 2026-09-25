'use strict';

const mongoose = require('mongoose');

const ethereumLoginChallengeSchema = new mongoose.Schema({
  address: { type: String, required: true, trim: true, index: true },
  chainId: { type: Number, required: true, min: 1 },
  domain: { type: String, required: true, trim: true },
  uri: { type: String, required: true, trim: true },
  nonceHash: { type: String, required: true },
  message: { type: String, required: true, select: false },
  messageHash: { type: String, required: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

ethereumLoginChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ethereumLoginChallengeSchema.index({ address: 1, createdAt: -1 });

module.exports = mongoose.models.EthereumLoginChallenge
  || mongoose.model('EthereumLoginChallenge', ethereumLoginChallengeSchema);
