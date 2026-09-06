const mongoose = require('mongoose');

const virtualRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 120 },
  hostUserId: { type: String, required: true, index: true },
  state: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'live', 'ended', 'archive'],
    default: 'draft',
    index: true
  },
  accessPolicy: {
    type: String,
    enum: ['public', 'authenticated', 'private'],
    default: 'authenticated'
  },
  capacity: { type: Number, min: 1, max: 500, default: 100 },
  allowedUserIds: { type: [String], default: [] },
  blockedUserIds: { type: [String], default: [] },
  stagePolicy: {
    type: String,
    enum: ['host-only', 'host-approved'],
    default: 'host-only'
  },
  sceneManifestVersion: { type: String, default: '1' },
  scheduledFor: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.VirtualRoom || mongoose.model('VirtualRoom', virtualRoomSchema);
