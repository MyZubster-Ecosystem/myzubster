const mongoose = require('mongoose');

const zorgaxCreditAccountSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    balanceCredits: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= 0;
        },
        message: 'balanceCredits must be a non-negative safe integer'
      }
    },

    totalPurchasedCredits: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= 0;
        },
        message: 'totalPurchasedCredits must be a non-negative safe integer'
      }
    },

    totalConsumedCredits: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= 0;
        },
        message: 'totalConsumedCredits must be a non-negative safe integer'
      }
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

zorgaxCreditAccountSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports =
  mongoose.models.ZorgaxCreditAccount ||
  mongoose.model('ZorgaxCreditAccount', zorgaxCreditAccountSchema);