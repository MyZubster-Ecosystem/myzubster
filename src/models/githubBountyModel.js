const mongoose = require('mongoose');

const rewardDeclarationSchema = new mongoose.Schema({
  asset: {
    type: String,
    enum: ['MYZ', 'XMR', 'TOKEN'],
    required: true
  },
  amount: {
    type: String,
    default: null
  },
  raw: {
    type: String,
    default: null
  }
}, { _id: false });

const pullRequestSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  url: { type: String, default: null },
  author: { type: String, default: null },
  merged: { type: Boolean, default: false },
  mergedAt: { type: Date, default: null }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  reviewer: { type: String, required: true },
  state: {
    type: String,
    enum: ['approved', 'changes_requested', 'commented', 'dismissed', 'unknown'],
    default: 'unknown'
  },
  submittedAt: { type: Date, default: null }
}, { _id: false });

const githubBountySchema = new mongoose.Schema({
  sourceKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  repository: {
    type: String,
    required: true,
    index: true
  },
  sourceVisibility: {
    type: String,
    enum: ['public', 'private', 'internal'],
    default: 'public',
    index: true
  },
  issueNumber: {
    type: Number,
    required: true,
    index: true
  },
  githubIssueId: {
    type: Number,
    default: null
  },
  githubNodeId: {
    type: String,
    default: null
  },
  url: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  bodyPreview: {
    type: String,
    default: ''
  },
  bodySha256: {
    type: String,
    default: null
  },
  githubState: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  tracked: {
    type: Boolean,
    default: true,
    index: true
  },
  labels: {
    type: [String],
    default: []
  },
  lifecycleStatus: {
    type: String,
    enum: [
      'proposed',
      'validated',
      'approved',
      'funded',
      'active',
      'submitted',
      'under_review',
      'verified',
      'reward_recorded',
      'settlement_pending',
      'settled',
      'closed',
      'cancelled',
      'unknown'
    ],
    default: 'unknown',
    index: true
  },
  rewardAssets: [{
    type: String,
    enum: ['MYZ', 'XMR', 'TOKEN']
  }],
  rewardDeclarations: {
    type: [rewardDeclarationSchema],
    default: []
  },
  assignees: {
    type: [String],
    default: []
  },
  claimedBy: {
    type: String,
    default: null
  },
  author: {
    type: String,
    default: null
  },
  reviewMode: {
    type: String,
    enum: ['normal', 'manual', 'multi'],
    default: 'normal'
  },
  reviewers: {
    type: [reviewSchema],
    default: []
  },
  pullRequests: {
    type: [pullRequestSchema],
    default: []
  },
  sensitivity: {
    type: String,
    enum: ['normal', 'elevated', 'high'],
    default: 'normal'
  },
  evidenceRequired: {
    type: Boolean,
    default: false
  },
  sourceCreatedAt: { type: Date, default: null },
  sourceUpdatedAt: { type: Date, default: null },
  sourceClosedAt: { type: Date, default: null },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

githubBountySchema.index(
  { repository: 1, issueNumber: 1 },
  { unique: true }
);

githubBountySchema.index({ tracked: 1, lifecycleStatus: 1 });
githubBountySchema.index({ sourceVisibility: 1, tracked: 1 });

module.exports = mongoose.model('GitHubBounty', githubBountySchema);
