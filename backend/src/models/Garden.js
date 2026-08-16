const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const gardenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '', index: true },
    gps: { type: pointSchema, required: true },
    geocoding: {
      displayName: { type: String, default: '' },
      type: { type: String, default: '' },
      category: { type: String, default: '' },
      osmId: { type: String, default: '' },
      osmType: { type: String, default: '' },
      importance: { type: Number, default: 0 },
    },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active', index: true },
    photos: { type: [String], default: [] },
    ownerId: { type: String, default: '', index: true },
    // Legacy fields retained for compatibility with older consumers.
    neighborhood: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
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

gardenSchema.virtual('lat').get(function () {
  return this.gps?.coordinates?.[1];
});

gardenSchema.virtual('lng').get(function () {
  return this.gps?.coordinates?.[0];
});

gardenSchema.index({ gps: '2dsphere' });
gardenSchema.index({ name: 'text', description: 'text', address: 'text' });

gardenSchema.pre('validate', function (next) {
  if (this.gps?.coordinates?.length === 2) {
    this.coordinates = { lat: this.gps.coordinates[1], lng: this.gps.coordinates[0] };
  } else if (this.coordinates?.lat != null && this.coordinates?.lng != null) {
    this.gps = { type: 'Point', coordinates: [this.coordinates.lng, this.coordinates.lat] };
  }
  next();
});

module.exports = mongoose.model('Garden', gardenSchema);
