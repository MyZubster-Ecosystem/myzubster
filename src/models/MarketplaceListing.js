const mongoose = require('mongoose');
const { notifyAdminActivity } = require('../services/adminActivityNotificationService');

const marketplaceListingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ownerUsername: { type: String, default: '' },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, index: true },
  price: { type: Number, default: 0, min: 0 },
  currency: { type: String, required: true, index: true },
  exchangeMode: { type: String, enum: ['payment', 'gift', 'barter'], default: 'payment' },
  description: { type: String, default: '', maxlength: 4000 },
  location: { type: String, default: '', maxlength: 160 },
  species: { type: String, default: '', maxlength: 120 },
  variety: { type: String, default: '', maxlength: 120 },
  features: { type: [String], default: [] },
  contact: { type: mongoose.Schema.Types.Mixed, default: {} },
  pet: { type: mongoose.Schema.Types.Mixed, default: null },
  kefir: { type: mongoose.Schema.Types.Mixed, default: null },
  stock: { type: Number, default: 1, min: 0 },
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active', index: true }
}, { timestamps: true });

marketplaceListingSchema.index({ status: 1, createdAt: -1 });
marketplaceListingSchema.post('save', function notifyNewListing(listing) {
  if (!listing.createdAt || Math.abs(Date.now() - new Date(listing.createdAt).getTime()) > 15000) return;
  void notifyAdminActivity('listing', { listingId: listing._id, ownerId: listing.ownerId, ownerUsername: listing.ownerUsername, title: listing.title, category: listing.category, price: listing.price, currency: listing.currency, exchangeMode: listing.exchangeMode, location: listing.location });
});

module.exports = mongoose.models.MarketplaceListing || mongoose.model('MarketplaceListing', marketplaceListingSchema);
