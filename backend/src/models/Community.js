const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  communityId: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  ownerId: { type: String, required: true, index: true },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.Community || mongoose.model('Community', communitySchema);
