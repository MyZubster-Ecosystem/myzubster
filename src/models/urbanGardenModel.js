const mongoose = require('mongoose');

const PrivateLocationSchema = new mongoose.Schema({
  algorithm: { type: String, required: true, enum: ['aes-256-gcm'] },
  keyVersion: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true }
}, { _id: false });

const urbanGardenSchema = new mongoose.Schema({
  gardenId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'fruit_tree', 'vegetable_garden', 'herb_garden', 'community_garden',
      'municipal_garden', 'botanical_garden', 'permaculture_site',
      'seed_bank', 'rooftop_garden'
    ],
    required: true
  },
  location: {
    lat: Number,
    lng: Number,
    address: String,
    city: String,
    country: String,
    visibility: { type: String, enum: ['private', 'approximate', 'public'], default: 'private' },
    precision: { type: String, enum: ['hidden', 'approx-1km', 'exact'], default: 'hidden' },
    consentVersion: String,
    consentedAt: Date
  },
  privateLocation: { type: PrivateLocationSchema, select: false },
  size: { type: String, enum: ['small', 'medium', 'large', 'xlarge'], default: 'small' },
  plants: [{ plantName: String, plantType: String, quantity: Number, plantedAt: Date }],
  seedExchange: {
    enabled: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 }
  },
  status: { type: String, enum: ['active', 'dormant', 'harvested', 'abandoned'], default: 'active' },
  isPublic: { type: Boolean, default: false },
  certifications: [{ type: String, certId: String, issuedAt: Date }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

urbanGardenSchema.statics.findByCategory = function findByCategory(category) {
  return this.find({ category, isPublic: true });
};

urbanGardenSchema.statics.findNearby = function findNearby(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const longitudeScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const lngDelta = radiusMeters / (111320 * longitudeScale);
  return this.find({
    isPublic: true,
    'location.visibility': { $in: ['approximate', 'public'] },
    'location.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
    'location.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta }
  });
};

module.exports = mongoose.model('UrbanGarden', urbanGardenSchema);
