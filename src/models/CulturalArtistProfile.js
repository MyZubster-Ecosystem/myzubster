const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  kind: { type: String, enum: ['CREW', 'SOUND_SYSTEM', 'TRIBE', 'SCENE', 'MOVEMENT', 'LABEL', 'COLLECTIVE'], required: true },
  name: { type: String, required: true, trim: true },
  state: {
    type: String,
    enum: ['SELF_ATTESTED', 'OTHER_PARTY_ATTESTED', 'MUTUALLY_CONFIRMED', 'SOURCE_SUPPORTED', 'COLLECTIVE_CONFIRMED', 'UNVERIFIED', 'DISPUTED', 'REVOKED'],
    default: 'UNVERIFIED'
  },
  sourceUrl: { type: String, default: '' },
  observedAt: { type: Date, default: Date.now }
}, { _id: true });

const culturalArtistProfileSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
  stageName: { type: String, required: true, trim: true, index: true },
  bio: { type: String, default: '', trim: true },
  styles: [{ type: String, trim: true }],
  publicRegion: { type: String, default: '', trim: true },
  musicLinks: [{
    platform: { type: String, enum: ['SOUNDCLOUD', 'BANDCAMP', 'MIXCLOUD', 'YOUTUBE', 'OTHER'], required: true },
    url: { type: String, required: true, trim: true },
    sourceState: { type: String, enum: ['ARTIST_SUPPLIED', 'SOURCE_SUPPORTED', 'UNVERIFIED'], default: 'UNVERIFIED' }
  }],
  relationships: [relationshipSchema],
  claimState: { type: String, enum: ['UNCLAIMED', 'CLAIMED', 'DISPUTED'], default: 'UNCLAIMED', index: true }
}, { timestamps: true });

module.exports = mongoose.model('CulturalArtistProfile', culturalArtistProfileSchema);
