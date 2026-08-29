'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const ECONOMIC_ENTRY_TYPES = Object.freeze({
  REVENUE_RECOGNIZED: 'REVENUE_RECOGNIZED',
  EXPENSE_RECOGNIZED: 'EXPENSE_RECOGNIZED',
  LIABILITY_ACCRUED: 'LIABILITY_ACCRUED',
  LIABILITY_SETTLED: 'LIABILITY_SETTLED',
  TREASURY_INFLOW: 'TREASURY_INFLOW',
  TREASURY_OUTFLOW: 'TREASURY_OUTFLOW'
});

const ECONOMIC_SOURCE_TYPES = Object.freeze({
  PAYMENT_INTENT: 'PAYMENT_INTENT',
  CAPITAL_ALLOCATION: 'CAPITAL_ALLOCATION',
  INVOICE: 'INVOICE',
  MANUAL: 'MANUAL',
  SYSTEM: 'SYSTEM',
  OTHER: 'OTHER'
});

const economicLedgerEntrySchema = new mongoose.Schema({
  entryId: {
    type: String,
    required: true,
    unique: true,
    default: () => `zel_${crypto.randomUUID()}`
  },
  ownerId: { type: String, required: true, index: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: Object.values(ECONOMIC_ENTRY_TYPES),
    index: true
  },
  asset: { type: String, required: true, uppercase: true, trim: true, index: true },
  network: { type: String, default: null, trim: true, index: true },
  amountMinor: { type: Number, required: true, min: 1 },
  sourceType: {
    type: String,
    required: true,
    enum: Object.values(ECONOMIC_SOURCE_TYPES)
  },
  sourceReference: { type: String, required: true, trim: true },
  description: { type: String, default: null, trim: true },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

economicLedgerEntrySchema.index(
  { ownerId: 1, asset: 1, network: 1, sourceType: 1, sourceReference: 1 },
  { unique: true }
);

economicLedgerEntrySchema.index({ ownerId: 1, asset: 1, network: 1, occurredAt: -1 });

const ZorgaxEconomicLedgerEntry = mongoose.models.ZorgaxEconomicLedgerEntry ||
  mongoose.model('ZorgaxEconomicLedgerEntry', economicLedgerEntrySchema);

module.exports = {
  ECONOMIC_ENTRY_TYPES,
  ECONOMIC_SOURCE_TYPES,
  ZorgaxEconomicLedgerEntry
};
