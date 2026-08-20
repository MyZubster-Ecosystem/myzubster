const mongoose = require('mongoose');

const zorgaxDaoDecisionSchema = new mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true,
    },
    entityId: { type: String, default: 'ZORGAX-001', immutable: true, index: true },
    role: { type: String, default: 'advisory_ai_member', immutable: true },
    choice: { type: String, enum: ['for', 'against', 'abstain'], required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    rationale: { type: String, required: true, maxlength: 3000 },
    risks: [{ type: String, maxlength: 500 }],
    conditions: [{ type: String, maxlength: 500 }],
    provider: { type: String, default: 'ollama' },
    model: { type: String, required: true },
    proposalDigest: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    binding: { type: Boolean, default: false, immutable: true },
    votingWeight: { type: Number, default: 0, immutable: true },
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

// One current advisory position per proposal. Re-running advice updates the audited position.
zorgaxDaoDecisionSchema.index({ proposalId: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('ZorgaxDaoDecision', zorgaxDaoDecisionSchema);
