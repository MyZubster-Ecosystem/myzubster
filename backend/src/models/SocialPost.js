const mongoose = require('mongoose');

const socialPostSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true, index: true },
  authorId: { type: String, required: true, index: true },
  communityId: { type: String, default: null, index: true },
  body: { type: String, required: true },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.SocialPost || mongoose.model('SocialPost', socialPostSchema);
