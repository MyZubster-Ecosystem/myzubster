const mongoose = require('mongoose');

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
    country: { type: String, trim: true }
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

// Virtual field: expose location as gps for frontend compatibility
PlantSchema.virtual('gps').get(function() {
  if (this.location && typeof this.location.lat === 'number' && typeof this.location.lng === 'number') {
    return { lat: this.location.lat, lng: this.location.lng };
  }
  return null;
});

// Ensure virtuals are included in JSON responses
PlantSchema.set('toJSON', { virtuals: true });
PlantSchema.set('toObject', { virtuals: true });

// Indici per ricerche rapide
PlantSchema.index({ name: 'text', scientificName: 'text', species: 'text' });
PlantSchema.index({ species: 1 });
PlantSchema.index({ family: 1 });
PlantSchema.index({ verified: 1 });
PlantSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Plant', PlantSchema);
