const mongoose = require('mongoose');

const CHOICES = ['for', 'against', 'abstain'];

const voteSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
    voterId: { type: String, required: true },
    choice: { type: String, enum: CHOICES, required: true },
    weight: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: '', maxlength: 500 },
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

// One vote per voter per proposal
voteSchema.index({ proposalId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
