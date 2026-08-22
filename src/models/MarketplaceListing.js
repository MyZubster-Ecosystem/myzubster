const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema({
  listingId: { type: String, required: true, unique: true, index: true },
  assetId: { type: String, required: true, index: true },
  sellerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sellerWallet: { type: String, default: null },
  priceMyz: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
    index: true
  },
  buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  buyerWallet: { type: String, default: null },
  saleTxHash: { type: String, default: null },
  soldAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.MarketplaceListing || mongoose.model('MarketplaceListing', marketplaceListingSchema);
