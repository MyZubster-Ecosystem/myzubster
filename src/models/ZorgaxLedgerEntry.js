const mongoose = require('mongoose');

const LEDGER_TYPES = Object.freeze({
  PURCHASE: 'PURCHASE',
  USAGE: 'USAGE',
  REFUND: 'REFUND',
  BONUS: 'BONUS',
  ADJUSTMENT: 'ADJUSTMENT'
});

const zorgaxLedgerEntrySchema = new mongoose.Schema(
  {
    entryId: {
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

    type: {
      type: String,
      required: true,
      enum: Object.values(LEDGER_TYPES),
      index: true
    },

    amountCredits: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          return (
            Number.isSafeInteger(value) &&
            value !== 0
          );
        },
        message: 'amountCredits must be a non-zero safe integer'
      }
    },

    balanceAfterCredits: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= 0;
        },
        message: 'balanceAfterCredits must be a non-negative safe integer'
      }
    },

    productId: {
      type: String,
      default: null,
      trim: true
    },

    paymentIntentId: {
      type: String,
      default: null,
      trim: true
    },

    usageReference: {
      type: String,
      default: null,
      trim: true
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

zorgaxLedgerEntrySchema.index(
  {
    ownerId: 1,
    createdAt: -1
  },
  {
    name: 'zorgax_ledger_owner_created'
  }
);

zorgaxLedgerEntrySchema.index(
  {
    paymentIntentId: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      paymentIntentId: { $type: 'string' }
    },
    name: 'uniq_zorgax_ledger_payment_intent'
  }
);

zorgaxLedgerEntrySchema.index(
  {
    ownerId: 1,
    usageReference: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      usageReference: { $type: 'string' }
    },
    name: 'uniq_zorgax_ledger_usage_reference'
  }
);

zorgaxLedgerEntrySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = {
  LEDGER_TYPES,
  ZorgaxLedgerEntry:
    mongoose.models.ZorgaxLedgerEntry ||
    mongoose.model('ZorgaxLedgerEntry', zorgaxLedgerEntrySchema)
};