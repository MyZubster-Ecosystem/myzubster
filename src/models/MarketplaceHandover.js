const mongoose = require('mongoose');

const marketplaceHandoverSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  method: { type: String, enum: ['HAND_DELIVERY'], default: 'HAND_DELIVERY' },
  state: {
    type: String,
    enum: ['ACCEPTED', 'HANDED_OVER', 'RECEIVED', 'RECORDED'],
    default: 'ACCEPTED',
    index: true
  },
  acceptedAt: { type: Date, default: Date.now },
  handedOverAt: { type: Date, default: null },
  receivedAt: { type: Date, default: null },
  recordedAt: { type: Date, default: null }
}, { timestamps: true });

marketplaceHandoverSchema.index({ listingId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.models.MarketplaceHandover || mongoose.model('MarketplaceHandover', marketplaceHandoverSchema);
