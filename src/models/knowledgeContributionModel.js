const mongoose = require('mongoose');

const knowledgeContributionSchema = new mongoose.Schema({
  contributionId: { type: String, required: true, unique: true, index: true },
  authorId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  reference: { type: String, default: null },
  pilotId: { type: String, default: null, index: true },
  category: { type: String, default: null },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REWARD_ELIGIBLE', 'REWARDED'],
    default: 'PENDING_REVIEW',
    index: true,
  },
  reviewerId: { type: String, default: null },
  reviewNotes: { type: String, default: null },
  reputationPoints: { type: Number, default: 0, min: 0 },
  rewardId: { type: String, default: null, index: true },
  ledgerReference: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  rewardedAt: { type: Date, default: null },
}, { timestamps: true });

knowledgeContributionSchema.index({ authorId: 1, pilotId: 1, createdAt: -1 });

module.exports = mongoose.model('KnowledgeContribution', knowledgeContributionSchema);
