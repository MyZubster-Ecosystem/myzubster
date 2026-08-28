'use strict';

const mongoose = require('mongoose');

const zorgaxPaymentIntentSchema = new mongoose.Schema({
  intentId: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  plan: { type: String, enum: ['pro', 'developer'], required: true },
  asset: { type: String, enum: ['ETH', 'BTC', 'XMR', 'TARI'], required: true },
  destination: { type: String, required: true },
  quote: {
    denomination: { type: String, enum: ['EUR'], default: 'EUR' },
    amount: { type: Number, required: true },
    cryptoAmount: { type: String, required: true },
    eurPerCoin: { type: Number, required: true },
    observedAt: { type: Date, required: true },
    source: { type: String, required: true },
    status: { type: String, enum: ['QUOTED'], default: 'QUOTED' }
  },
  settlement: {
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'], default: 'PENDING', index: true },
    paymentReference: { type: String, default: null },
    verifier: { type: String, default: null },
    confirmations: { type: Number, default: null },
    verifiedAt: { type: Date, default: null }
  },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null }
}, { timestamps: true });

zorgaxPaymentIntentSchema.index({ ownerId: 1, createdAt: -1 });
zorgaxPaymentIntentSchema.index({ 'settlement.paymentReference': 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.ZorgaxPaymentIntent || mongoose.model('ZorgaxPaymentIntent', zorgaxPaymentIntentSchema);
