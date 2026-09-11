'use strict';

const mongoose = require('mongoose');

const PaymentDashboardTransactionSchema = new mongoose.Schema({
  provider: { type: String, enum: ['STRIPE'], default: 'STRIPE', index: true },
  checkoutSessionId: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 255 },
  paymentIntentId: { type: String, trim: true, maxlength: 255, index: true, sparse: true },
  actor: { type: String, trim: true, maxlength: 120, index: true },
  requestHash: { type: String, trim: true, maxlength: 128, index: true },
  amountCents: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
  paymentStatus: { type: String, required: true, trim: true, maxlength: 40, index: true },
  checkoutStatus: { type: String, trim: true, maxlength: 40 },
  livemode: { type: Boolean, default: false, index: true },
  customerEmail: { type: String, trim: true, lowercase: true, maxlength: 320 },
  stripeCreatedAt: { type: Date },
  verifiedAt: { type: Date, required: true, default: Date.now, index: true },
  conversion: {
    sourceAsset: { type: String, enum: ['EUR'] },
    targetAsset: { type: String, enum: ['MYZ'] },
    rateMyzPerEur: { type: Number, min: 0 },
    amountMyz: { type: Number, min: 0 },
    state: { type: String, enum: ['ACCOUNTING_RECORDED'], index: true },
    recordedAt: { type: Date }
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.PaymentDashboardTransaction || mongoose.model('PaymentDashboardTransaction', PaymentDashboardTransactionSchema);
