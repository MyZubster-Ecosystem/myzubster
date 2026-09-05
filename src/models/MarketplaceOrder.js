const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quantity: { type: Number, min: 1, max: 1000, default: 1 },
  note: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['REQUESTED','ACCEPTED','REJECTED','COMPLETED','CANCELLED'], default: 'REQUESTED', index: true },
  snapshot: {
    title: { type: String, required: true },
    price: { type: Number, default: 0 },
    currency: { type: String, required: true },
    exchangeMode: { type: String, required: true }
  },
  acceptedAt: Date,
  rejectedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

marketplaceOrderSchema.index({ buyerId: 1, createdAt: -1 });
marketplaceOrderSchema.index({ sellerId: 1, createdAt: -1 });

marketplaceOrderSchema.post('save', async function ensureCircularPassport(order) {
  if (order.status !== 'COMPLETED') return;
  try {
    const MarketplaceListing = mongoose.models.MarketplaceListing || require('./MarketplaceListing');
    const CircularItemPassport = mongoose.models.CircularItemPassport || require('./CircularItemPassport');
    const listing = await MarketplaceListing.findById(order.listingId).select('title category').lean();
    if (!listing) return;

    await CircularItemPassport.updateOne(
      { orderId: order._id },
      {
        $setOnInsert: {
          ownerId: order.buyerId,
          listingId: order.listingId,
          orderId: order._id,
          title: listing.title || order.snapshot.title,
          category: listing.category,
          state: 'IN_USE',
          events: [{ type: 'ACQUIRED', actorId: order.buyerId, note: 'Marketplace order completed', occurredAt: order.completedAt || new Date() }]
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('[CircularItemPassport] automatic creation failed', { orderId: String(order._id), error: error.message });
  }
});

module.exports = mongoose.models.MarketplaceOrder || mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
