const mongoose = require('mongoose');

const metaverseCharacterSchema = new mongoose.Schema(
  {
    characterId: { type: String, required: true, unique: true, index: true, trim: true },
    displayName: { type: String, required: true, trim: true, maxlength: 30 },
    characterName: { type: String, required: true, trim: true, maxlength: 30, index: true },
    archetype: {
      type: String,
      enum: ['guardian', 'explorer', 'maker', 'chronicler', 'scientist'],
      default: 'explorer'
    },
    identityStatus: { type: String, enum: ['guest', 'account-linked'], default: 'guest' },
    worldId: { type: String, default: 'neon-plaza', index: true },
    createdFrom: { type: String, enum: ['public-web', 'account-github'], default: 'public-web' },
    accountUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true, unique: true, index: true },
    github: {
      id: { type: String, trim: true, sparse: true },
      login: { type: String, trim: true },
      profileUrl: { type: String, trim: true },
      verifiedAt: { type: Date }
    },
    lastSeenAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true,
    minimize: true
  }
);

metaverseCharacterSchema.index({ worldId: 1, createdAt: -1 });
metaverseCharacterSchema.index({ 'github.id': 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.MetaverseCharacter
  || mongoose.model('MetaverseCharacter', metaverseCharacterSchema);
