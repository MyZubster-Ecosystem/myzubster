const mongoose = require('mongoose');

const ARCHETYPES = ['guardian', 'explorer', 'maker', 'chronicler', 'scientist'];

const IdentityBountySubmissionSchema = new mongoose.Schema({
  bountyKey: {
    type: String,
    default: 'identity-genesis-v0.1',
    immutable: true,
    index: true
  },
  participantKey: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 96
  },
  identityMode: {
    type: String,
    enum: ['guest-unverified', 'account-unverified', 'verified'],
    default: 'account-unverified'
  },
  publicProfile: {
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    requestedMyzId: { type: String, trim: true, maxlength: 80, default: null },
    bio: { type: String, trim: true, maxlength: 500, default: '' }
  },
  character: {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    archetype: { type: String, enum: ARCHETYPES, required: true },
    visualRef: { type: String, trim: true, maxlength: 500, default: null }
  },
  checklist: {
    confirmedOwnProfile: { type: Boolean, required: true, default: false },
    acceptedPublicProfileRules: { type: Boolean, required: true, default: false },
    acceptedNoSecrets: { type: Boolean, required: true, default: false },
    acceptedHumanReview: { type: Boolean, required: true, default: false }
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'changes_requested', 'approved', 'rejected', 'reward_recorded'],
    default: 'draft',
    index: true
  },
  reward: {
    asset: { type: String, enum: ['MYZ'], default: 'MYZ' },
    amount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['not_eligible', 'pending_review', 'recorded', 'cancelled'],
      default: 'not_eligible'
    },
    ledgerReference: { type: String, trim: true, maxlength: 160, default: null },
    recordedAt: { type: Date, default: null }
  },
  review: {
    decision: {
      type: String,
      enum: ['none', 'approved', 'changes_requested', 'rejected'],
      default: 'none'
    },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    reviewer: { type: String, trim: true, maxlength: 80, default: null },
    reviewedAt: { type: Date, default: null }
  },
  submittedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

IdentityBountySubmissionSchema.index(
  { bountyKey: 1, participantKey: 1 },
  { unique: true }
);
IdentityBountySubmissionSchema.index({ 'character.name': 1 });

IdentityBountySubmissionSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('IdentityBountySubmission', IdentityBountySubmissionSchema);
