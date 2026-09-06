const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['follow', 'community', 'message', 'session'] },
  category: { type: String, required: true, enum: ['social', 'community', 'message', 'session'] },
  dedupeKey: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  deepLink: { type: String, required: true },
  readAt: { type: Date, default: null, index: true }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
