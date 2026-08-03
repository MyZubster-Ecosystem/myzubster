const mongoose = require('mongoose');

const RobotWalletSchema = new mongoose.Schema({
  // Robot identity
  robotId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  robotName: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerUsername: {
    type: String,
    required: true,
    trim: true
  },

  // AWS AgentCore wallet info
  agentCoreWalletId: {
    type: String,
    trim: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  walletPublicKey: {
    type: String,
    trim: true
  },
  chain: {
    type: String,
    default: 'base-mainnet',
    enum: ['base-mainnet', 'base-sepolia']
  },
  token: {
    type: String,
    default: 'USDC',
    enum: ['USDC', 'ETH', 'MYZ']
  },

  // Spending governance
  dailyCapUSD: {
    type: Number,
    default: 50,
    min: 0
  },
  perTransactionCapUSD: {
    type: Number,
    default: 20,
    min: 0
  },
  dailySpentUSD: {
    type: Number,
    default: 0
  },
  dailySpentDate: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  },

  // Audit
  auditTrail: [{
    action: { type: String, required: true },
    amount: { type: Number },
    currency: { type: String },
    txHash: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
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

RobotWalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

RobotWalletSchema.index({ owner: 1 });
RobotWalletSchema.index({ walletAddress: 1 });
RobotWalletSchema.index({ robotId: 1 });

module.exports = mongoose.model('RobotWallet', RobotWalletSchema);
