const mongoose = require('mongoose');

const PAYMENT_INTENT_STATES = [
  'PENDING',
  'AWAITING_PAYMENT',
  'SUBMITTED',
  'CONFIRMED',
  'EXPIRED',
  'FAILED',
  'CANCELLED'
];

const paymentIntentSchema = new mongoose.Schema(
  {
    intentId: {
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

    purpose: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

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
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'amountMinor must be a safe integer'
      }
    },

    destination: {
      type: String,
      default: null,
      trim: true
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    txId: {
      type: String,
      default: null,
      trim: true
    },

    status: {
      type: String,
      enum: PAYMENT_INTENT_STATES,
      default: 'PENDING',
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    submittedAt: {
      type: Date,
      default: null
    },

    confirmedAt: {
      type: Date,
      default: null
    },

    failureReason: {
      type: String,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

paymentIntentSchema.index(
  { destination: 1 },
  {
    unique: true,
    partialFilterExpression: {
      destination: { $type: 'string' }
    },
    name: 'uniq_payment_intent_destination'
  }
);

paymentIntentSchema.index(
  { asset: 1, network: 1, txId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      txId: { $type: 'string' }
    },
    name: 'uniq_payment_intent_transaction'
  }
);

module.exports =
  mongoose.models.PaymentIntent ||
  mongoose.model('PaymentIntent', paymentIntentSchema);

module.exports.PAYMENT_INTENT_STATES = PAYMENT_INTENT_STATES;
