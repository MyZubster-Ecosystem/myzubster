const mongoose = require('mongoose');

const rewardComponentSchema = new mongoose.Schema({
  asset: {
    type: String,
    enum: ['MYZ', 'XMR', 'TOKEN'],
    required: true
  },
  amount: {
    type: String,
    required: true,
    validate: {
      validator: value => /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number(value) > 0,
      message: 'amount must be a positive decimal string'
    }
  },
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

const bountyConfigSchema = new mongoose.Schema({
  issueNumber: { type: Number, required: true, unique: true, index: true },
  repository: { type: String, required: true },
  rewardAmount: { type: Number, required: true, default: 10 },
  currency: { type: String, default: 'MYZ' },
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
    enum: ['open', 'claimed', 'completed', 'payment_pending', 'paid', 'cancelled'],
    default: 'open'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentNetwork: { type: String, default: 'Tari' },
  paymentAsset: { type: String, default: 'MYZ' },
  paymentRecipient: { type: String, trim: true, default: null },
  paymentTxId: { type: String, trim: true, default: null },
  paymentFailureReason: { type: String, default: null },
  paymentSubmittedAt: { type: Date, default: null },
  paymentConfirmedAt: { type: Date, default: null },
  claimedBy: { type: String, default: null },
  paymentWallet: { type: String, trim: true, default: null },
  prNumber: { type: Number, default: null },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bountyConfigSchema.pre('validate', function(next) {
  if (!this.rewardComponents || this.rewardComponents.length === 0) return next();
  for (const component of this.rewardComponents) {
    if (component.asset === 'TOKEN' && (!component.network || !component.contractAddress)) {
      return next(new Error('TOKEN rewards require network and contractAddress'));
    }
    if (component.asset !== 'TOKEN' && component.contractAddress) {
      return next(new Error('contractAddress is only valid for TOKEN rewards'));
    }
  }
  next();
});

bountyConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BountyConfig', bountyConfigSchema);
