'use strict';

const mongoose = require('mongoose');

function zeroDecimal() {
  return mongoose.Types.Decimal128.fromString('0');
}

const treasuryAccountSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true, trim: true },
  asset: { type: String, required: true, trim: true },
  network: { type: String, required: true, trim: true },
  availableAtomic: { type: mongoose.Schema.Types.Decimal128, required: true },
  reservedAtomic: { type: mongoose.Schema.Types.Decimal128, required: true, default: zeroDecimal },
  settledAtomic: { type: mongoose.Schema.Types.Decimal128, required: true, default: zeroDecimal },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

treasuryAccountSchema.index({ asset: 1, network: 1 }, { unique: true });
treasuryAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.TreasuryAccount || mongoose.model('TreasuryAccount', treasuryAccountSchema);
