const mongoose = require('mongoose');

const moderationEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['control_changed', 'report_created', 'moderation_action'], required: true, index: true },
  actorUserId: { type: String, required: true, index: true },
  targetUserId: { type: String, default: null, index: true },
  action: { type: String, required: true, maxlength: 80 },
  contextType: { type: String, default: null, maxlength: 40 },
  contextId: { type: String, default: null, maxlength: 160 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

module.exports = mongoose.models.ModerationEvent || mongoose.model('ModerationEvent', moderationEventSchema);
