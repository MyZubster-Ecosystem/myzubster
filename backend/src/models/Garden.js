const mongoose = require('mongoose');

const gardenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    neighborhood: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    ownerId: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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

gardenSchema.index({ coordinates: '2dsphere' });
gardenSchema.index({ name: 'text', description: 'text', address: 'text', neighborhood: 'text', city: 'text' });
gardenSchema.index({ city: 1, neighborhood: 1 });

module.exports = mongoose.model('Garden', gardenSchema);
