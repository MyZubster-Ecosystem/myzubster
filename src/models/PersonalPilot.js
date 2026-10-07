const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, trim: true, maxlength: 80 },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  kind: { type: String, enum: ['esp32', 'arduino', 'sensor_gateway', 'other'], required: true },
  sensors: { type: [String], default: [] },
  evidenceState: { type: String, enum: ['DECLARED', 'DOCUMENTED', 'TESTED', 'VERIFIED'], default: 'DECLARED' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
  type: { type: String, enum: ['garden', 'kefir'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  locationLabel: { type: String, trim: true, maxlength: 120 },
  cultureId: { type: String, trim: true, maxlength: 100 },
  sampleId: { type: String, trim: true, maxlength: 100 },
  status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
  evidenceState: { type: String, enum: ['DECLARED', 'DOCUMENTED', 'TESTED', 'VERIFIED'], default: 'DECLARED' },
  devices: { type: [deviceSchema], default: [] }
}, { timestamps: true });

schema.index({ ownerId: 1, updatedAt: -1 });
schema.index({ ownerId: 1, type: 1 });

module.exports = mongoose.model('PersonalPilot', schema);
