const mongoose = require('mongoose');

const metaversePresenceSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true, trim: true },
  worldId: { type: String, required: true, default: 'neon-plaza', index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 30 },
  characterName: { type: String, required: true, trim: true, maxlength: 30 },
  archetype: { type: String, enum: ['guardian', 'explorer', 'maker', 'chronicler', 'scientist'], default: 'explorer' },
  myzId: { type: String, trim: true, default: null },
  identityStatus: { type: String, enum: ['guest', 'account-linked'], default: 'guest' },
  accountUserId: { type: String, trim: true, default: null },
  github: {
    login: { type: String, trim: true },
    profileUrl: { type: String, trim: true }
  },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  emote: { type: String, enum: ['wave', 'spark', 'idea', 'leaf'], default: null },
  emoteExpiresAt: { type: Date, default: null },
  joinedAt: { type: Date, required: true, default: Date.now },
  lastSeenAt: { type: Date, required: true, default: Date.now, index: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, minimize: true });

metaversePresenceSchema.index({ worldId: 1, expiresAt: 1, joinedAt: 1 });
metaversePresenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.MetaversePresence
  || mongoose.model('MetaversePresence', metaversePresenceSchema);
