const mongoose = require('mongoose');

const virtualSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  hostUserId: { type: String, required: true, index: true },
  state: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'archive'],
    default: 'scheduled',
    index: true
  },
  capacity: { type: Number, min: 1, max: 500, required: true },
  participantUserIds: { type: [String], default: [] },
  sceneManifestVersion: { type: String, default: '1' },
  lifecycleVersion: { type: Number, default: 1 },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.VirtualSession || mongoose.model('VirtualSession', virtualSessionSchema);
