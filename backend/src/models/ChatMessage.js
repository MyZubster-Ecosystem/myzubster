const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  clientMessageId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, index: true },
  senderUserId: { type: String, required: true, index: true },
  body: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

chatMessageSchema.index({ channelId: 1, clientMessageId: 1 }, { unique: true });
chatMessageSchema.index({ channelId: 1, createdAt: 1 });

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
