const mongoose = require('mongoose');

const zorgaxProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

    kind: {
      type: String,
      required: true,
      enum: [
        'CREDIT_PACK',
        'RESEARCH',
        'AGENT_EXECUTION',
        'API_USAGE',
        'SUBSCRIPTION',
        'SERVICE'
      ]
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    creditsGranted: {
      type: Number,
      default: 0,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= 0;
        },
        message: 'creditsGranted must be a non-negative safe integer'
      }
    },

    pricing: {
      asset: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        default: 'BTC'
      },

      network: {
        type: String,
        required: true,
        trim: true,
        default: 'bitcoin'
      },

      amountMinor: {
        type: Number,
        required: true,
        validate: {
          validator(value) {
            return Number.isSafeInteger(value) && value > 0;
          },
          message: 'pricing.amountMinor must be a positive safe integer'
        }
      }
    },

    usage: {
      unit: {
        type: String,
        enum: [
          'CREDITS',
          'REQUEST',
          'RESEARCH_JOB',
          'AGENT_RUN',
          'API_CALL',
          'MONTH'
        ],
        default: 'CREDITS'
      },

      creditsPerUnit: {
        type: Number,
        default: 0,
        validate: {
          validator(value) {
            return Number.isSafeInteger(value) && value >= 0;
          },
          message: 'usage.creditsPerUnit must be a non-negative safe integer'
        }
      }
    },

    entitlement: {
      key: {
        type: String,
        default: 'zorgax.access',
        trim: true
      },

      tier: {
        type: String,
        enum: ['FREE', 'PRO', 'DEVELOPER'],
        default: 'FREE'
      },

      durationDays: {
        type: Number,
        default: 0,
        validate: {
          validator(value) {
            return Number.isSafeInteger(value) && value >= 0 && value <= 3660;
          },
          message: 'entitlement.durationDays must be a safe integer from 0 to 3660'
        }
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

zorgaxProductSchema.index(
  {
    active: 1,
    kind: 1
  },
  {
    name: 'zorgax_product_active_kind'
  }
);

zorgaxProductSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports =
  mongoose.models.ZorgaxProduct ||
  mongoose.model('ZorgaxProduct', zorgaxProductSchema);
