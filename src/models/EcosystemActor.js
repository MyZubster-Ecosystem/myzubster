const mongoose = require('mongoose');

const ACTOR_TYPES = ['community', 'university', 'developer', 'individual'];
const ACTOR_STATUSES = ['active', 'inactive', 'archived'];

const ecosystemActorSchema = new mongoose.Schema({
  actorId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `actor-${new mongoose.Types.ObjectId().toString()}`
  },
  type: { type: String, enum: ACTOR_TYPES, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180, unique: true, index: true },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  github: {
    login: { type: String, default: '', trim: true, maxlength: 100 },
    org: { type: String, default: '', trim: true, maxlength: 100 },
    repositories: { type: [String], default: [] }
  },
  myzubsterProfile: { type: String, default: '', trim: true, maxlength: 500 },
  skills: { type: [String], default: [] },
  projects: { type: [String], default: [] },
  evidence: { type: [String], default: [] },
  status: { type: String, enum: ACTOR_STATUSES, default: 'active', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ecosystemActorSchema.index({ type: 1, status: 1, name: 1 });

ecosystemActorSchema.statics.actorTypes = ACTOR_TYPES;
ecosystemActorSchema.statics.actorStatuses = ACTOR_STATUSES;

module.exports = mongoose.models.EcosystemActor || mongoose.model('EcosystemActor', ecosystemActorSchema);
