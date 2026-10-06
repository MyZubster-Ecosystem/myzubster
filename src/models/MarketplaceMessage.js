const mongoose = require('mongoose');
const { notifyAdminActivity } = require('../services/adminActivityNotificationService');

const marketplaceMessageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  readAt: { type: Date, default: null }
}, { timestamps: true });

marketplaceMessageSchema.index({ orderId: 1, createdAt: 1 });
marketplaceMessageSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
marketplaceMessageSchema.post('save', function notifyNewMessage(message) {
  if (!message.createdAt || Math.abs(Date.now() - new Date(message.createdAt).getTime()) > 15000) return;
  void notifyAdminActivity('marketplace_message', { messageId: message._id, orderId: message.orderId, senderId: message.senderId, recipientId: message.recipientId, preview: String(message.body || '').slice(0, 300) });
});

module.exports = mongoose.models.MarketplaceMessage || mongoose.model('MarketplaceMessage', marketplaceMessageSchema);
