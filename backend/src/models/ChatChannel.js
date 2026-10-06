const mongoose = require('mongoose');

const chatChannelSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['direct', 'community'], required: true, index: true },
  participantUserIds: [{ type: String }],
  communityId: { type: String, default: null, index: true },
  createdByUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

chatChannelSchema.index({ type: 1, participantUserIds: 1 });

module.exports = mongoose.models.ChatChannel || mongoose.model('ChatChannel', chatChannelSchema);
