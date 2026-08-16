const mongoose = require('mongoose');

const PAYMENT_STATES = ['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'];
const CURRENCIES = ['MYZ', 'XMR'];
const PAYMENT_KINDS = ['simulated', 'real'];

const paymentSchema = new mongoose.Schema(
  {
    issueId: { type: String, required: true, index: true },
    contributor: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, enum: CURRENCIES, index: true },
    kind: { type: String, enum: PAYMENT_KINDS, default: 'simulated' },
    state: { type: String, enum: PAYMENT_STATES, default: 'PENDING', index: true },
    txid: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ issueId: 1, createdAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
