const mongoose = require('mongoose');

const REWARD_ASSETS = Object.freeze(['MYZ', 'XMR', 'TOKEN']);
const REWARD_STATUSES = Object.freeze(['ready', 'pending', 'allocated', 'submitted', 'confirmed', 'paid', 'failed', 'cancelled']);

const rewardComponentSchema = new mongoose.Schema({
  asset: { type: String, enum: REWARD_ASSETS, required: true },
  amount: { type: String, required: true },
  status: {
    type: String,
    enum: REWARD_STATUSES,
    default: 'ready'
  },
  network: { type: String, trim: true },
  contractAddress: { type: String, trim: true },
  walletAddress: { type: String, trim: true },
  txId: { type: String, trim: true },
  sourceReference: { type: String, trim: true },
  confirmationRequirement: { type: Number, min: 0 }
}, { _id: false });

function validateRewardComponent(component) {
  if (!/^\d+(?:\.\d+)?$/.test(String(component.amount)) || Number(component.amount) <= 0) {
    throw new Error(`${component.asset} reward amount must be a positive decimal value`);
  }

  if (component.asset === 'TOKEN' && (!component.network || !component.contractAddress)) {
    throw new Error('TOKEN rewards require network and contractAddress');
  }

  if (['allocated', 'submitted', 'confirmed', 'paid'].includes(component.status) && !component.walletAddress) {
    throw new Error(`${component.asset} ${component.status} reward requires walletAddress`);
  }

  if (['submitted', 'confirmed', 'paid'].includes(component.status) && !component.txId) {
    throw new Error(`${component.asset} ${component.status} reward requires txId`);
  }

  // A confirmed/paid component must be backed by an independent verification reference.
  // This keeps ledger submission distinct from verified settlement.
  if (['confirmed', 'paid'].includes(component.status) && !component.sourceReference) {
    throw new Error(`${component.asset} ${component.status} reward requires independent sourceReference`);
  }
}

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
  try {
    if (!this.rewardComponents || this.rewardComponents.length === 0) return next();
    for (const component of this.rewardComponents) validateRewardComponent(component);
    next();
  } catch (error) {
    next(error);
  }
});

BountySchema.methods.getRewardComponent = function(asset) {
  if (!REWARD_ASSETS.includes(asset)) throw new Error(`Unsupported reward asset: ${asset}`);
  return this.rewardComponents?.find(component => component.asset === asset) || null;
};

BountySchema.methods.recordRewardSubmission = function(asset, { walletAddress, txId, network } = {}) {
  const component = this.getRewardComponent(asset);
  if (!component) throw new Error(`${asset} is not declared on this bounty; silent asset conversion is forbidden`);
  if (!walletAddress || !txId) throw new Error('walletAddress and txId are required for submission');
  component.walletAddress = walletAddress;
  if (network) component.network = network;
  component.txId = txId;
  component.status = 'submitted';
  return component;
};

BountySchema.methods.confirmRewardSettlement = function(asset, { sourceReference } = {}) {
  const component = this.getRewardComponent(asset);
  if (!component) throw new Error(`${asset} is not declared on this bounty; silent asset conversion is forbidden`);
  if (component.status !== 'submitted') throw new Error(`${asset} must be submitted before confirmation`);
  if (!component.txId || !component.walletAddress) throw new Error(`${asset} submission is incomplete`);
  if (!sourceReference) throw new Error('independent sourceReference is required for confirmation');
  component.sourceReference = sourceReference;
  component.status = 'confirmed';
  return component;
};

BountySchema.methods.markRewardPaid = function(asset) {
  const component = this.getRewardComponent(asset);
  if (!component) throw new Error(`${asset} is not declared on this bounty; silent asset conversion is forbidden`);
  if (component.status !== 'confirmed' || !component.sourceReference) {
    throw new Error(`${asset} must be independently confirmed before paid`);
  }
  component.status = 'paid';
  return component;
};

BountySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

BountySchema.index({ status: 1 });
BountySchema.index({ issueNumber: 1 });
BountySchema.index({ repository: 1 });
BountySchema.index({ assignedTo: 1 });
BountySchema.index({ createdAt: -1 });

const Bounty = mongoose.model('Bounty', BountySchema);
Bounty.REWARD_ASSETS = REWARD_ASSETS;
Bounty.REWARD_STATUSES = REWARD_STATUSES;

module.exports = Bounty;
