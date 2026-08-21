'use strict';

const mongoose = require('mongoose');

const PAYMENT_ATTEMPT_STATES = Object.freeze({
  PREPARED: 'PREPARED',
  SUBMITTING: 'SUBMITTING',
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

const paymentAttemptSchema = new mongoose.Schema({
  attemptId: { type: String, required: true, unique: true, index: true, trim: true },
  reservationId: { type: String, required: true, index: true, trim: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true, trim: true },
  requestHash: { type: String, required: true, index: true, trim: true },
  recipient: { type: String, required: true, trim: true },
  asset: { type: String, required: true, trim: true },
  network: { type: String, required: true, trim: true },
  amount: { type: String, required: true, trim: true },
  issueNumber: { type: Number, default: null },
  prNumber: { type: Number, default: null },
  state: {
    type: String,
    enum: Object.values(PAYMENT_ATTEMPT_STATES),
    default: PAYMENT_ATTEMPT_STATES.PREPARED,
    index: true,
  },
  txId: { type: String, trim: true, default: null },
  lastError: { type: String, default: null },
  submittingAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

paymentAttemptSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.PaymentAttempt || mongoose.model('PaymentAttempt', paymentAttemptSchema);
module.exports.PAYMENT_ATTEMPT_STATES = PAYMENT_ATTEMPT_STATES;
