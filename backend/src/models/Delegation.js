const mongoose = require('mongoose');

const delegationSchema = new mongoose.Schema(
  {
    delegatorId: { type: String, required: true, index: true },
    delegateId: { type: String, required: true, index: true },
    tokenWeight: { type: Number, required: true, min: 1 },
    scope: { type: String, default: 'all' }, // 'all' | category name
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null },
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

delegationSchema.index({ delegatorId: 1, delegateId: 1, scope: 1 });

module.exports = mongoose.model('Delegation', delegationSchema);
