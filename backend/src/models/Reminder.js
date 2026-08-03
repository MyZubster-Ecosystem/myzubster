const mongoose = require('mongoose');

const REMINDER_TYPES = ['watering', 'fertilizing', 'harvesting', 'pruning'];
const FREQUENCIES = ['daily', 'every_2_days', 'every_3_days', 'weekly', 'biweekly', 'monthly', 'custom'];
const CHANNELS = ['email', 'push', 'telegram'];
const STATUSES = ['pending', 'sent', 'completed', 'skipped', 'missed'];

const reminderSchema = new mongoose.Schema(
  {
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      default: null,
    },
    gardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garden',
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: REMINDER_TYPES,
      index: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: FREQUENCIES,
    },
    customIntervalDays: {
      type: Number,
      min: 1,
      max: 365,
      default: null,
    },
    nextDue: {
      type: Date,
      required: true,
      index: true,
    },
    lastCompleted: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    channel: {
      type: String,
      enum: CHANNELS,
      default: 'push',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    history: [
      {
        action: { type: String, enum: ['completed', 'skipped', 'missed', 'sent'] },
        at: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

reminderSchema.index({ ownerId: 1, status: 1 });
reminderSchema.index({ gardenId: 1, type: 1 });
reminderSchema.index({ nextDue: 1, status: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
module.exports.REMINDER_TYPES = REMINDER_TYPES;
module.exports.FREQUENCIES = FREQUENCIES;
module.exports.CHANNELS = CHANNELS;
