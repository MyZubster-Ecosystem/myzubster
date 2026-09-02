const mongoose = require('mongoose');

const marketplaceMessageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  readAt: { type: Date, default: null }
}, { timestamps: true });

marketplaceMessageSchema.index({ orderId: 1, createdAt: 1 });
marketplaceMessageSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.models.MarketplaceMessage || mongoose.model('MarketplaceMessage', marketplaceMessageSchema);
