const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  settlementId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  contributorId: {
    type: String,
    required: true,
    index: true
  },

  contributionId: {
    type: String,
    required: true,
    index: true
  },

  rewardId: {
    type: String,
    required: true,
    index: true
  },

  network: {
    type: String,
    required: true
  },

  asset: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  transactionReference: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: [
      'SUBMITTED',
      'SETTLED',
      'FAILED'
    ],
    default: 'SUBMITTED'
  },

  privacyMode: {
    type: String,
    default: 'privacy_preserving'
  },

  proofType: {
    type: String,
    enum: [
      'REFERENCE_ONLY',
      'TX_PROOF'
    ],
    default: 'REFERENCE_ONLY'
  },

  txProof: {
    type: String,
    default: null
  },

  settledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

settlementSchema.index(
  {
    rewardId: 1,
    transactionReference: 1
  },
  {
    unique: true
  }
);

module.exports =
  mongoose.models.Settlement ||
  mongoose.model(
    'Settlement',
    settlementSchema
  );
