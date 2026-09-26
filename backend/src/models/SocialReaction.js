const mongoose = require('mongoose');

const socialReactionSchema = new mongoose.Schema({
  reactionId: { type: String, required: true, unique: true, index: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true },
  targetId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  kind: { type: String, enum: ['like', 'support', 'insightful'], default: 'like' },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });

socialReactionSchema.index({ targetType: 1, targetId: 1, userId: 1, kind: 1 }, { unique: true });

module.exports = mongoose.models.SocialReaction || mongoose.model('SocialReaction', socialReactionSchema);
