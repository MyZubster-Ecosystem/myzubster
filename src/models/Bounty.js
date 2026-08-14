const mongoose = require('mongoose');

const BountySchema = new mongoose.Schema({
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
  issueNumber: {
    type: Number,
    required: true,
    unique: true
  },
  issueUrl: {
    type: String,
    required: true
  },
  repository: {
    type: String,
    required: true,
    enum: ['myzubster', 'MyZubster-App', 'MyZubsterWeb', 'MyZubsterGateway']
  },
  amount: {
    type: Number,
    required: true,
    min: 0.0001
  },
  currency: {
    type: String,
    default: 'XMR'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'review', 'completed', 'cancelled'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToUsername: {
    type: String,
    trim: true
  },
  assignedToWallet: {
    type: String,
    trim: true
  },
  claimedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  paymentTxHash: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  prNumber: {
    type: Number
  },
  prUrl: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Middleware pre-save per aggiornare updatedAt
BountySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indici per ricerche rapide
BountySchema.index({ status: 1 });
BountySchema.index({ issueNumber: 1 });
BountySchema.index({ repository: 1 });
BountySchema.index({ assignedTo: 1 });
BountySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bounty', BountySchema);
