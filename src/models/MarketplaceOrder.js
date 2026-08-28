const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quantity: { type: Number, min: 1, default: 1 },
  note: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['REQUESTED','ACCEPTED','COMPLETED','CANCELLED'], default: 'REQUESTED', index: true },
  snapshot: {
    title: String,
    price: Number,
    currency: String,
    exchangeMode: String
  }
}, { timestamps: true });

marketplaceOrderSchema.index({ buyerId: 1, createdAt: -1 });
marketplaceOrderSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.models.MarketplaceOrder || mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
