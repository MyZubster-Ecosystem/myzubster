const mongoose = require('mongoose');

const bountyConfigSchema = new mongoose.Schema({
  issueNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  repository: {
    type: String,
    required: true
  },
  rewardAmount: {
    type: Number,
    required: true,
    default: 10
  },
  currency: {
    type: String,
    default: 'MYZ'
  },
  status: {
    type: String,
    enum: ['open', 'claimed', 'completed', 'paid'],
    default: 'open'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentNetwork: { type: String, default: 'Tari' },
  paymentAsset: { type: String, default: 'MYZ' },
  paymentRecipient: { type: String, default: null },
  paymentTxId: { type: String, default: null },
  paymentFailureReason: { type: String, default: null },
  paymentSubmittedAt: { type: Date, default: null },
  paymentConfirmedAt: { type: Date, default: null },
  claimedBy: {
    type: String,
    default: null
  },
  prNumber: {
    type: Number,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

bountyConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BountyConfig', bountyConfigSchema);
