const mongoose = require('mongoose');

const MunicipalitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  province: { type: String, trim: true },
  region: { type: String, trim: true },
  pec: { type: String, trim: true, lowercase: true },
  contactEmail: { type: String, trim: true, lowercase: true },
  website: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 2000 },
  lifeStatus: {
    type: String,
    enum: ['registered', 'interested', 'pilot_candidate', 'partner', 'inactive'],
    default: 'registered'
  },
  pilotFocus: [{ type: String, enum: ['water', 'circularity', 'urban_green', 'waste', 'mrv', 'other'] }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MunicipalitySchema.index({ name: 1, province: 1 }, { unique: true });
MunicipalitySchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });

module.exports = mongoose.model('Municipality', MunicipalitySchema);
