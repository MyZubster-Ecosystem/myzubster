const mongoose = require('mongoose');

const virtualRoomChatThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  nextAllowedAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

virtualRoomChatThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.VirtualRoomChatThrottle
  || mongoose.model('VirtualRoomChatThrottle', virtualRoomChatThrottleSchema);
