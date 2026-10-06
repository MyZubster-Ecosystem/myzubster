const mongoose = require('mongoose');

const ENTITLEMENT_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
});

const ENTITLEMENT_TIERS = Object.freeze({
  FREE: 'FREE',
  PRO: 'PRO',
  DEVELOPER: 'DEVELOPER'
});

const zorgaxEntitlementSchema = new mongoose.Schema(
  {
    entitlementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    ownerId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },

    entitlementKey: {
      type: String,
      required: true,
      default: 'zorgax.access',
      trim: true,
      index: true
    },

    tier: {
      type: String,
      required: true,
      enum: Object.values(ENTITLEMENT_TIERS),
      index: true
    },

    sourcePurchaseId: {
      type: String,
      required: true,
      trim: true
    },

    productId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(ENTITLEMENT_STATUSES),
      default: ENTITLEMENT_STATUSES.ACTIVE,
      index: true
    },

    startsAt: {
      type: Date,
      required: true
    },

    endsAt: {
      type: Date,
      required: true,
      index: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

zorgaxEntitlementSchema.index(
  { sourcePurchaseId: 1 },
  {
    unique: true,
    name: 'zorgax_entitlement_purchase_once'
  }
);

zorgaxEntitlementSchema.index(
  { ownerId: 1, entitlementKey: 1, status: 1, endsAt: -1 },
  {
    name: 'zorgax_entitlement_owner_access'
  }
);

zorgaxEntitlementSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = {
  ENTITLEMENT_STATUSES,
  ENTITLEMENT_TIERS,
  ZorgaxEntitlement:
    mongoose.models.ZorgaxEntitlement ||
    mongoose.model('ZorgaxEntitlement', zorgaxEntitlementSchema)
};
