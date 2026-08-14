
/**
 * Bounty Model
 * Mongoose schema for bounties with reward assignment and minting support
 */

const mongoose = require('mongoose');

const BountySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    reward: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: [0, 'Reward must be non-negative']
    },
    currency: {
      type: String,
      default: 'XMR',
      enum: ['XMR', 'BTC', 'ETH', 'USD', 'EUR']
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'completed', 'cancelled'],
      default: 'open'
    },
    // Assignment fields
    assignee: {
      type: String,
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    // Minting fields
    minted: {
      type: Boolean,
      default: false
    },
    mintTxHash: {
      type: String,
      default: null
    },
    mintedAt: {
      type: Date,
      default: null
    },
    walletAddress: {
      type: String,
      default: null
    },
    // Optional metadata
    tags: {
      type: [String],
      default: []
    },
    githubIssueUrl: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
BountySchema.index({ status: 1 });
BountySchema.index({ assignee: 1 });
BountySchema.index({ minted: 1 });
BountySchema.index({ createdAt: -1 });

/**
 * Virtual: isEligibleForMinting
 * A bounty is eligible for minting if it has an assignee and hasn't been minted yet
 */
BountySchema.virtual('isEligibleForMinting').get(function () {
  return !!this.assignee && !this.minted;
});

/**
 * Static: findEligibleForAutoMint
 * Find all assigned-but-not-yet-minted bounties
 */
BountySchema.statics.findEligibleForAutoMint = function () {
  return this.find({ status: 'assigned', minted: false, assignee: { $ne: null } });
};

/**
 * Static: findOpenBounties
 */
BountySchema.statics.findOpenBounties = function () {
  return this.find({ status: 'open' });
};

module.exports = mongoose.model('Bounty', BountySchema);
    