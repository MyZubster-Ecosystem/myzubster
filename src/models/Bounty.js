const mongoose = require('mongoose');

const rewardComponentSchema = new mongoose.Schema({
  asset: { type: String, enum: ['MYZ', 'XMR', 'TOKEN'], required: true },
  amount: { type: String, required: true },
  status: {
    type: String,
    enum: ['ready', 'pending', 'allocated', 'submitted', 'confirmed', 'paid', 'failed', 'cancelled'],
    default: 'ready'
  },
  network: { type: String, trim: true },
  contractAddress: { type: String, trim: true },
  walletAddress: { type: String, trim: true },
  txId: { type: String, trim: true },
  sourceReference: { type: String, trim: true },
  confirmationRequirement: { type: Number, min: 0 }
}, { _id: false });

const BountySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  issueNumber: { type: Number, required: true, unique: true },
  issueUrl: { type: String, required: true },
  repository: {
    type: String,
    required: true,
    enum: ['myzubster', 'MyZubster-App', 'MyZubsterWeb', 'MyZubsterGateway']
  },
  amount: { type: Number, required: true, min: 0.0001 },
  currency: { type: String, default: 'XMR' },
  rewardComponents: {
    type: [rewardComponentSchema],
    default: undefined,
    validate: {
      validator: components => {
        if (!components || components.length === 0) return true;
        const assets = components.map(component => component.asset);
        return new Set(assets).size === assets.length;
      },
      message: 'rewardComponents must contain each asset at most once'
    }
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'review', 'completed', 'payment_pending', 'cancelled'],
    default: 'open'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToUsername: { type: String, trim: true },
  assignedToWallet: { type: String, trim: true },
  claimedAt: { type: Date },
  completedAt: { type: Date },
  paymentTxHash: { type: String, trim: true },
  paidAt: { type: Date },
  prNumber: { type: Number },
  prUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BountySchema.pre('validate', function(next) {
  if (!this.rewardComponents || this.rewardComponents.length === 0) return next();
  for (const component of this.rewardComponents) {
    if (component.asset === 'TOKEN' && (!component.network || !component.contractAddress)) {
      return next(new Error('TOKEN rewards require network and contractAddress'));
    }
  }
  next();
});

BountySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

BountySchema.index({ status: 1 });
BountySchema.index({ issueNumber: 1 });
BountySchema.index({ repository: 1 });
BountySchema.index({ assignedTo: 1 });
BountySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bounty', BountySchema);
