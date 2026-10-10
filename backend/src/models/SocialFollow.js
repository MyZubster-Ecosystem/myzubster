const mongoose = require('mongoose');

const socialFollowSchema = new mongoose.Schema({
  followerId: { type: String, required: true, index: true },
  followeeId: { type: String, required: true, index: true },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

socialFollowSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

module.exports = mongoose.models.SocialFollow || mongoose.model('SocialFollow', socialFollowSchema);
