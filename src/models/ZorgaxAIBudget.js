'use strict';

const mongoose = require('mongoose');

const ZorgaxAIBudgetSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  reservedUsd: { type: Number, default: 0, min: 0 },
  spentUsd: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ZorgaxAIBudget', ZorgaxAIBudgetSchema);
