const mongoose = require('mongoose');

const LifeHempCircularEntrySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['fiber-textiles', 'paper-packaging', 'building-materials', 'agri-residues']
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  territory: { type: String, trim: true, maxlength: 160 },
  reusedMaterialKg: { type: Number, min: 0, default: 0 },
  avoidedWasteKg: { type: Number, min: 0, default: 0 },
  estimatedCo2eAvoidedKg: { type: Number, min: 0, default: 0 },
  evidenceUrl: { type: String, trim: true, maxlength: 1000 },
  verified: { type: Boolean, default: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdByUsername: { type: String, trim: true, maxlength: 80 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

LifeHempCircularEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LifeHempCircularEntry', LifeHempCircularEntrySchema);
