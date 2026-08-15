const mongoose = require('mongoose');

const TX_TYPES = ['deposit', 'withdrawal', 'transfer', 'reward'];

const treasurySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: 'Main Treasury' },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'XMR' },
    ownerId: { type: String, required: true, index: true },
    transactions: [{
      type: { type: String, enum: TX_TYPES, required: true },
      amount: { type: Number, required: true },
      from: { type: String, default: '' },
      to: { type: String, default: '' },
      proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', default: null },
      note: { type: String, default: '' },
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

treasurySchema.index({ ownerId: 1 });

module.exports = mongoose.model('Treasury', treasurySchema);
