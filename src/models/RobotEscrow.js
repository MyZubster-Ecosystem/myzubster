const mongoose = require('mongoose');

const RobotEscrowSchema = new mongoose.Schema({
  // Escrow identity (Boson x402B)
  escrowId: {
    type: String,
    required: true,
    unique: true,
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

  // Linked job
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RobotJob',
    required: true
  },
  jobId: {
    type: String,
    required: true,
    trim: true
  },

  // Parties
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RobotWallet',
    required: true
  },
  sellerAddress: {
    type: String,
    required: true,
    trim: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerAddress: {
    type: String,
    trim: true
  },

  // Amount
  amountUSD: {
    type: Number,
    required: true,
    min: 0.01
  },
  token: {
    type: String,
    default: 'USDC'
  },
  chain: {
    type: String,
    default: 'base-mainnet'
  },

  // Boson x402B state machine
  state: {
    type: String,
    enum: [
      'initialized',
      'committed',
      'redeemed',
      'completed',
      'disputed',
      'refunded',
      'cancelled'
    ],
    default: 'initialized'
  },

  // Commit/redeem tx hashes
  commitTxHash: { type: String, trim: true },
  redeemTxHash: { type: String, trim: true },
  refundTxHash: { type: String, trim: true },

  // Timestamps
  committedAt: { type: Date },
  redeemedAt: { type: Date },
  completedAt: { type: Date },
  disputedAt: { type: Date },
  refundedAt: { type: Date },

  // Dispute
  disputeReason: { type: String, trim: true },
  disputeResolution: { type: String, trim: true },

  // MyZ fee
  feePercent: { type: Number, default: 2 },
  feeAmountUSD: { type: Number },
  feeTxHash: { type: String, trim: true },
  feeCollectedAt: { type: Date },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

RobotEscrowSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

RobotEscrowSchema.index({ job: 1 });
RobotEscrowSchema.index({ seller: 1 });
RobotEscrowSchema.index({ state: 1 });
RobotEscrowSchema.index({ escrowId: 1 });

module.exports = mongoose.model('RobotEscrow', RobotEscrowSchema);
