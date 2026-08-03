const mongoose = require('mongoose');

const RobotJobSchema = new mongoose.Schema({
  // Job identity
  jobId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },

  // Parties
  robot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RobotWallet',
    required: true
  },
  robotId: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientUsername: {
    type: String,
    required: true,
    trim: true
  },

  // Payment
  amountUSD: {
    type: Number,
    required: true,
    min: 0.01
  },
  feePercent: {
    type: Number,
    default: 2,
    min: 0,
    max: 100
  },
  feeAmountUSD: {
    type: Number,
    required: true
  },
  robotPayoutUSD: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USDC'
  },
  chain: {
    type: String,
    default: 'base-mainnet'
  },

  // Boson x402B Escrow
  escrowId: {
    type: String,
    trim: true
  },
  bosonOfferId: {
    type: String,
    trim: true
  },
  bosonExchangeId: {
    type: String,
    trim: true
  },

  // Job lifecycle
  status: {
    type: String,
    enum: [
      'created',
      'escrow_committed',
      'in_progress',
      'submitted',
      'disputed',
      'redeemed',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'created'
  },

  // Timestamps for lifecycle
  committedAt: { type: Date },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  verifiedAt: { type: Date },
  redeemedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  refundedAt: { type: Date },

  // Delivery
  deliveryProof: {
    type: String,
    trim: true
  },
  deliveryUrl: {
    type: String,
    trim: true
  },

  // Reputation
  reputationNftId: {
    type: String,
    trim: true
  },

  // MyZ fee collection
  feeTxHash: {
    type: String,
    trim: true
  },
  feeCollectedAt: {
    type: Date
  },

  // Audit
  auditTrail: [{
    action: { type: String, required: true },
    by: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
    txHash: { type: String }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

RobotJobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

RobotJobSchema.index({ robot: 1 });
RobotJobSchema.index({ client: 1 });
RobotJobSchema.index({ status: 1 });
RobotJobSchema.index({ jobId: 1 });
RobotJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RobotJob', RobotJobSchema);
