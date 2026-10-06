const mongoose = require('mongoose');

const interactionControlSchema = new mongoose.Schema({
  ownerUserId: { type: String, required: true, index: true },
  targetUserId: { type: String, required: true, index: true },
  kind: { type: String, enum: ['block', 'mute'], required: true, index: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

interactionControlSchema.index({ ownerUserId: 1, targetUserId: 1, kind: 1 }, { unique: true });

module.exports = mongoose.models.InteractionControl || mongoose.model('InteractionControl', interactionControlSchema);
