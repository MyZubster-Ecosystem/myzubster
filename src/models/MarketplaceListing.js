const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema({
  listingId: { type: String, required: true, unique: true, index: true },
  assetId: { type: String, required: true, index: true },
  sellerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerWallet: { type: String, required: true },
  chainId: { type: Number, required: true },
  priceMyz: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'sale_pending', 'sold', 'cancelled'],
    default: 'active',
    index: true
  },
  buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  buyerWallet: { type: String, default: null },
  paymentTxHash: { type: String, default: null },
  nftTransferTxHash: { type: String, default: null },
  saleTxHash: { type: String, default: null },
  paymentVerification: { type: mongoose.Schema.Types.Mixed, default: null },
  nftTransferVerification: { type: mongoose.Schema.Types.Mixed, default: null },
  soldAt: { type: Date, default: null }
}, { timestamps: true });

marketplaceListingSchema.index({ paymentTxHash: 1 }, { unique: true, sparse: true });
marketplaceListingSchema.index({ nftTransferTxHash: 1 }, { unique: true, sparse: true });
marketplaceListingSchema.index({ assetId: 1, status: 1 });

module.exports = mongoose.models.MarketplaceListing || mongoose.model('MarketplaceListing', marketplaceListingSchema);
