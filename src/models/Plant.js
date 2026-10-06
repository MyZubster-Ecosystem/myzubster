const mongoose = require('mongoose');

const PrivateLocationSchema = new mongoose.Schema({
  algorithm: { type: String, required: true, enum: ['aes-256-gcm'] },
  keyVersion: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true }
}, { _id: false });

const PlantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  species: {
    type: String,
    required: true,
    trim: true
  },
  family: {
    type: String,
    trim: true
  },
  genus: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['tree', 'shrub', 'herb', 'vine', 'succulent', 'aquatic', 'other'],
    default: 'other'
  },
  height: {
    type: Number,
    min: 0
  },
  bloomSeason: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter', 'year-round'],
    default: 'year-round'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    visibility: {
      type: String,
      enum: ['private', 'approximate', 'public'],
      default: 'private'
    },
    precision: {
      type: String,
      enum: ['hidden', 'approx-1km', 'exact'],
      default: 'hidden'
    },
    consentVersion: { type: String, trim: true },
    consentedAt: { type: Date }
  },
  privateLocation: {
    type: PrivateLocationSchema,
    select: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  imageUrl: {
    type: String
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    trim: true
  },
  conservationStatus: {
    type: String,
    enum: ['least-concern', 'vulnerable', 'endangered', 'critically-endangered', 'extinct-in-wild', 'unknown'],
    default: 'unknown'
  },
  isEdible: {
    type: Boolean,
    default: false
  },
  isMedicinal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pre-save per aggiornare updatedAt
PlantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indici per ricerche rapide
PlantSchema.index({ name: 'text', scientificName: 'text', species: 'text' });
PlantSchema.index({ 'location.lat': 1, 'location.lng': 1 });
PlantSchema.index({ species: 1 });
PlantSchema.index({ family: 1 });
PlantSchema.index({ verified: 1 });
PlantSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Plant', PlantSchema);
