const mongoose = require('mongoose');
const urbanGardenSchema = new mongoose.Schema({
  gardenId: {type: String, required: true, unique: true, index: true},
  name: {type: String, required: true},
  ownerId: {type: String, required: true},
  category: {type: String, enum: ['fruit_tree','vegetable_garden','herb_garden','community_garden','rooftop_garden'], required: true},
  location: {lat: {type: Number, required: true}, lng: {type: Number, required: true}, address: String},
  size: {type: String, enum: ['small','medium','large','xlarge'], default: 'small'},
  plants: [{plantName: String, plantType: String, quantity: Number, plantedAt: Date}],
  status: {type: String, enum: ['active','dormant','harvested','abandoned'], default: 'active'},
  isPublic: {type: Boolean, default: true},
  certifications: [{type: String, certId: String, issuedAt: Date}],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});
urbanGardenSchema.statics.findByCategory = function(cat) { return this.find({category: cat, isPublic: true}); };
urbanGardenSchema.statics.findNearby = function(lat, lng, maxDist) {
  return this.find({isPublic: true, 'location.lat': {$gte: lat-maxDist, $lte: lat+maxDist}, 'location.lng': {$gte: lng-maxDist, $lte: lng+maxDist}});
};
module.exports = mongoose.model('UrbanGarden', urbanGardenSchema);
