const mongoose = require('mongoose');

const communityMembershipSchema = new mongoose.Schema({
  communityId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['member', 'moderator', 'owner'], default: 'member' },
  status: { type: String, enum: ['active', 'suspended', 'left'], default: 'active', index: true },
  joinedAt: { type: Date, default: Date.now }
}, { versionKey: false });

communityMembershipSchema.index({ communityId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.CommunityMembership || mongoose.model('CommunityMembership', communityMembershipSchema);
