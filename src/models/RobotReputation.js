const mongoose = require('mongoose');

const RobotReputationSchema = new mongoose.Schema({
  // Robot identity
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
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },

  // ERC-8004 Soulbound NFT
  nftTokenId: {
    type: String,
    trim: true
  },
  nftContractAddress: {
    type: String,
    trim: true
  },
  nftTxHash: {
    type: String,
    trim: true
  },
  chain: {
    type: String,
    default: 'base-mainnet'
  },

  // Reputation scores (0-100 scale)
  scores: {
    punctuality: { type: Number, default: 50, min: 0, max: 100 },
    quality: { type: Number, default: 50, min: 0, max: 100 },
    reliability: { type: Number, default: 50, min: 0, max: 100 },
    overall: { type: Number, default: 50, min: 0, max: 100 }
  },

  // Job statistics
  totalJobs: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  disputedJobs: { type: Number, default: 0 },
  cancelledJobs: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },

  // Reviews
  reviews: [{
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'RobotJob' },
    jobId: { type: String },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewerUsername: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],

  // On-chain attestation history
  attestations: [{
    eventType: { type: String, enum: ['job_completed', 'review_added', 'score_updated'] },
    txHash: { type: String },
    timestamp: { type: Date, default: Date.now },
    newScore: { type: Number }
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

RobotReputationSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Recalculate overall score
  if (this.scores) {
    this.scores.overall = Math.round(
      (this.scores.punctuality + this.scores.quality + this.scores.reliability) / 3
    );
  }

  // Recalculate success rate
  if (this.totalJobs > 0) {
    this.successRate = Math.round((this.completedJobs / this.totalJobs) * 100);
  }

  next();
});

RobotReputationSchema.index({ robot: 1 });
RobotReputationSchema.index({ robotId: 1 });
RobotReputationSchema.index({ walletAddress: 1 });
RobotReputationSchema.index({ 'scores.overall': -1 });

module.exports = mongoose.model('RobotReputation', RobotReputationSchema);
