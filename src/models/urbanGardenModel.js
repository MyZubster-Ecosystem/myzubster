const mongoose = require('mongoose');
const urbanGardenSchema = new mongoose.Schema({
  gardenId: {type: String, required: true, unique: true, index: true},
  name: {type: String, required: true},
  ownerId: {type: String, required: true},
  category: {
    type: String,
    enum: [
      'fruit_tree',
      'vegetable_garden',
      'herb_garden',
      'community_garden',
      'municipal_garden',
      'botanical_garden',
      'permaculture_site',
      'seed_bank',
      'rooftop_garden'
    ],
    required: true
  },
  location: {lat: {type: Number, required: true}, lng: {type: Number, required: true}, address: String},
  size: {type: String, enum: ['small','medium','large','xlarge'], default: 'small'},
  plants: [{plantName: String, plantType: String, quantity: Number, plantedAt: Date}],
  seedExchange: {
    enabled: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 }
  },
  status: {type: String, enum: ['active','dormant','harvested','abandoned'], default: 'active'},
  isPublic: {type: Boolean, default: true},
  certifications: [{type: String, certId: String, issuedAt: Date}],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});
urbanGardenSchema.statics.findByCategory = function(cat) { return this.find({category: cat, isPublic: true}); };
urbanGardenSchema.statics.findNearby = function(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const longitudeScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const lngDelta = radiusMeters / (111320 * longitudeScale);
  return this.find({
    isPublic: true,
    'location.lat': {$gte: lat-latDelta, $lte: lat+latDelta},
    'location.lng': {$gte: lng-lngDelta, $lte: lng+lngDelta}
  });
};
module.exports = mongoose.model('UrbanGarden', urbanGardenSchema);
