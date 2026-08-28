'use strict';

const mongoose = require('mongoose');

const zorgaxSubscriptionSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  plan: { type: String, enum: ['pro', 'developer'], required: true },
  asset: { type: String, enum: ['ETH', 'BTC', 'XMR', 'TARI'], required: true },
  paymentReference: { type: String, required: true, unique: true, index: true },
  verification: {
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    verifier: { type: String, default: null },
    verifiedAt: { type: Date, default: null }
  },
  access: {
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'EXPIRED'], default: 'PENDING' },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }
  },
  renewalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'ZorgaxSubscription', default: null }
}, { timestamps: true });

zorgaxSubscriptionSchema.index({ ownerId: 1, 'access.status': 1, 'access.expiresAt': -1 });

module.exports = mongoose.models.ZorgaxSubscription || mongoose.model('ZorgaxSubscription', zorgaxSubscriptionSchema);
