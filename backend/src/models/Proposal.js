const mongoose = require('mongoose');

const STATUSES = ['draft', 'active', 'passed', 'rejected', 'executed', 'cancelled'];
const CATEGORIES = ['funding', 'feature', 'policy', 'treasury', 'parameter_change', 'other'];

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    proposerId: { type: String, required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'draft', index: true },

    // Voting params
    quorum: { type: Number, default: 50 },          // min % of total tokens that must vote
    approvalThreshold: { type: Number, default: 50 }, // min % yes votes to pass
    votingStartsAt: { type: Date, default: null },
    votingEndsAt: { type: Date, default: null },

    // Tally (denormalised for fast reads)
    votesFor: { type: Number, default: 0 },
    votesAgainst: { type: Number, default: 0 },
    votesAbstain: { type: Number, default: 0 },
    totalVotingPower: { type: Number, default: 0 },

    // Execution
    executionPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    executedAt: { type: Date, default: null },

    // Discussion
    comments: [{
      authorId: { type: String, required: true },
      text: { type: String, required: true, maxlength: 2000 },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

proposalSchema.index({ status: 1, votingEndsAt: 1 });
proposalSchema.index({ proposerId: 1, status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
module.exports.STATUSES = STATUSES;
module.exports.CATEGORIES = CATEGORIES;
