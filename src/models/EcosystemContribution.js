const crypto = require('crypto');
const mongoose = require('mongoose');

const CONTRIBUTION_STATUSES = ['proposed', 'opened', 'merged', 'closed', 'verified'];
const GITHUB_KINDS = ['issue', 'pull_request', 'commit', 'release'];

function buildDedupeKey({ actorIds = [], projectId = '', sourceKey = '' } = {}) {
  const canonical = [
    [...new Set((actorIds || []).map(String))].sort().join(','),
    String(projectId || '').trim(),
    String(sourceKey || '').trim()
  ].join('|');
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

const ecosystemContributionSchema = new mongoose.Schema({
  contributionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `contrib-${new mongoose.Types.ObjectId().toString()}`
  },
  actorIds: {
    type: [String],
    required: true,
    validate: value => Array.isArray(value) && value.length > 0
  },
  projectId: { type: String, required: true, trim: true, maxlength: 200, index: true },
  title: { type: String, required: true, trim: true, maxlength: 240 },
  description: { type: String, default: '', trim: true, maxlength: 4000 },
  status: { type: String, enum: CONTRIBUTION_STATUSES, default: 'proposed', index: true },
  github: {
    kind: { type: String, enum: GITHUB_KINDS, required: true },
    sourceKey: { type: String, required: true, trim: true, maxlength: 300, index: true },
    repository: { type: String, required: true, trim: true, maxlength: 200, index: true },
    number: { type: Number, default: null },
    sha: { type: String, default: '', trim: true, maxlength: 64 },
    releaseTag: { type: String, default: '', trim: true, maxlength: 200 },
    githubId: { type: Number, default: null },
    nodeId: { type: String, default: '', trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    title: { type: String, default: '', trim: true, maxlength: 300 },
    author: { type: String, default: '', trim: true, maxlength: 100 },
    sourceState: { type: String, default: '', trim: true, maxlength: 80 },
    merged: { type: Boolean, default: false },
    verifiedAt: { type: Date, required: true }
  },
  evidenceRefs: { type: [String], default: [] },
  githubWorkEvidence: {
    evidenceHash: { type: String, default: '', trim: true, maxlength: 64 },
    algorithm: { type: String, enum: ['', 'sha256'], default: '' },
    commitment: { type: String, default: '', trim: true, maxlength: 160 }
  },
  dedupeKey: { type: String, required: true, unique: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ecosystemContributionSchema.index({ actorIds: 1, createdAt: -1 });
ecosystemContributionSchema.index({ projectId: 1, status: 1, createdAt: -1 });

ecosystemContributionSchema.statics.statuses = CONTRIBUTION_STATUSES;
ecosystemContributionSchema.statics.githubKinds = GITHUB_KINDS;
ecosystemContributionSchema.statics.buildDedupeKey = buildDedupeKey;

module.exports = mongoose.models.EcosystemContribution || mongoose.model('EcosystemContribution', ecosystemContributionSchema);
