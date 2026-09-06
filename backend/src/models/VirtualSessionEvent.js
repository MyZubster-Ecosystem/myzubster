const mongoose = require('mongoose');

const virtualSessionEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  sequence: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    enum: ['session_created', 'session_started', 'participant_joined', 'participant_left', 'session_ended']
  },
  state: { type: String, required: true },
  participantCount: { type: Number, min: 0, required: true },
  sceneManifestVersion: { type: String, default: '1' },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { versionKey: false });

virtualSessionEventSchema.index({ sessionId: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.models.VirtualSessionEvent || mongoose.model('VirtualSessionEvent', virtualSessionEventSchema);
