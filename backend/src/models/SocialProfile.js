const mongoose = require('mongoose');

const socialProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  interests: [{ type: String, trim: true }],
  locale: { type: String, default: null },
  visibility: { type: String, enum: ['public', 'community', 'private'], default: 'private', index: true },
  trustLevel: { type: String, enum: ['new', 'member', 'trusted', 'moderator'], default: 'new' },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.SocialProfile || mongoose.model('SocialProfile', socialProfileSchema);
