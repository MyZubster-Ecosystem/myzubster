const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true, enum: ['social', 'community', 'message', 'session'] },
  inProductEnabled: { type: Boolean, default: true }
}, { timestamps: true });

NotificationPreferenceSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', NotificationPreferenceSchema);
