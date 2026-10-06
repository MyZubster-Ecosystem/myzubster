'use strict';

const mongoose = require('mongoose');

const ZorgaxAIUsageSchema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  model: { type: String, required: true, index: true },
  inputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  costUsd: { type: Number, required: true, min: 0 },
  route: { type: String, default: 'zorgax' },
  requestId: { type: String, sparse: true, unique: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

ZorgaxAIUsageSchema.index({ provider: 1, model: 1, createdAt: 1 });

module.exports = mongoose.model('ZorgaxAIUsage', ZorgaxAIUsageSchema);
