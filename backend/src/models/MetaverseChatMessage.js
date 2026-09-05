const mongoose = require('mongoose');

const metaverseChatMessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true, trim: true },
  worldId: { type: String, required: true, default: 'neon-plaza', index: true },
  sessionId: { type: String, required: true, trim: true },
  characterName: { type: String, required: true, trim: true, maxlength: 30 },
  text: { type: String, required: true, trim: true, maxlength: 280 },
  createdAt: { type: Date, required: true, default: Date.now, index: true },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

metaverseChatMessageSchema.index({ worldId: 1, createdAt: -1 });
metaverseChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.MetaverseChatMessage
  || mongoose.model('MetaverseChatMessage', metaverseChatMessageSchema);
