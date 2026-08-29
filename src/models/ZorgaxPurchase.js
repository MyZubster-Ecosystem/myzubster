const mongoose = require('mongoose');

const PURCHASE_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  CREDITED: 'CREDITED'
});

const zorgaxPurchaseSchema = new mongoose.Schema(
  {
    purchaseId: {
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

    productId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },

    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    creditsGranted: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value > 0;
        },
        message: 'creditsGranted must be a positive safe integer'
      }
    },

    payment: {
      asset: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },

      network: {
        type: String,
        required: true,
        trim: true
      },

      amountMinor: {
        type: Number,
        required: true,
        validate: {
          validator(value) {
            return Number.isSafeInteger(value) && value > 0;
          },
          message: 'payment.amountMinor must be a positive safe integer'
        }
      }
    },

    entitlement: {
      key: {
        type: String,
        default: null,
        trim: true
      },

      tier: {
        type: String,
        enum: ['PRO', 'DEVELOPER'],
        default: null
      },

      durationDays: {
        type: Number,
        default: null,
        validate: {
          validator(value) {
            return value === null ||
              (Number.isSafeInteger(value) && value > 0 && value <= 3660);
          },
          message: 'entitlement.durationDays must be null or a positive safe integer up to 3660'
        }
      }
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(PURCHASE_STATUSES),
      default: PURCHASE_STATUSES.PENDING,
      index: true
    },

    creditedAt: {
      type: Date,
      default: null
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

zorgaxPurchaseSchema.index(
  {
    ownerId: 1,
    createdAt: -1
  },
  {
    name: 'zorgax_purchase_owner_created'
  }
);

zorgaxPurchaseSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = {
  PURCHASE_STATUSES,

  ZorgaxPurchase:
    mongoose.models.ZorgaxPurchase ||
    mongoose.model(
      'ZorgaxPurchase',
      zorgaxPurchaseSchema
    )
};
