const mongoose = require('mongoose');

const socialCommentSchema = new mongoose.Schema({
  commentId: { type: String, required: true, unique: true, index: true },
  postId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  body: { type: String, required: true },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.SocialComment || mongoose.model('SocialComment', socialCommentSchema);
