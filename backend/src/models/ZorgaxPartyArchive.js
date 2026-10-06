const mongoose = require('mongoose');

const ArchiveAssetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['replay', 'highlight', 'archive'],
    required: true
  },
  title: { type: String, required: true, maxlength: 160 },
  url: { type: String, required: true, maxlength: 2048 },
  approved: { type: Boolean, default: false },
  consentVerified: { type: Boolean, default: false }
}, { _id: false });

const ZorgaxPartyArchiveSchema = new mongoose.Schema({
  archiveId: { type: String, required: true, unique: true, index: true },
  communityId: { type: String, required: true, default: 'myzubster-metaverse', index: true },
  eventId: { type: String, default: null, maxlength: 160 },
  roomId: { type: String, required: true, default: 'neon-plaza', index: true },
  state: { type: String, enum: ['ended', 'archived'], default: 'archived', index: true },
  visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'private', index: true },
  assets: { type: [ArchiveAssetSchema], default: [] },
  liveCapabilitiesExpiredAt: { type: Date, required: true },
  createdByUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.ZorgaxPartyArchive || mongoose.model('ZorgaxPartyArchive', ZorgaxPartyArchiveSchema);
