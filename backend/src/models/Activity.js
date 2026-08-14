const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    gardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garden',
      index: true,
    },
    plantType: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['plant_added', 'plant_updated', 'harvest', 'comment'],
      required: true,
    },
    actor: {
      id: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: 'Anonimo' },
      avatar: { type: String, default: '' },
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
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

activitySchema.index({ createdAt: -1 });
activitySchema.index({ gardenId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
