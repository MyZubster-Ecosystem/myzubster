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
    identityStatus: { type: String, enum: ['guest'], default: 'guest' },
    worldId: { type: String, default: 'neon-plaza', index: true },
    createdFrom: { type: String, enum: ['public-web'], default: 'public-web' },
    lastSeenAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true,
    minimize: true
  }
);

metaverseCharacterSchema.index({ worldId: 1, createdAt: -1 });

module.exports = mongoose.models.MetaverseCharacter
  || mongoose.model('MetaverseCharacter', metaverseCharacterSchema);
