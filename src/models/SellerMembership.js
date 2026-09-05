const mongoose = require('mongoose');

const sellerMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  plan: { type: String, enum: ['SELLER_MONTHLY'], default: 'SELLER_MONTHLY' },
  status: { type: String, enum: ['PENDING_PAYMENT','ACTIVE','EXPIRED','SUSPENDED','CANCELLED'], default: 'PENDING_PAYMENT', index: true },
  priceAmount: { type: Number, min: 0, required: true },
  priceCurrency: { type: String, enum: ['EUR'], default: 'EUR' },
  billingReference: { type: String, trim: true, maxlength: 200 },
  paymentReference: { type: String, trim: true, maxlength: 300 },
  paymentProvider: { type: String, enum: ['MANUAL','STRIPE'], default: 'MANUAL', index: true },
  stripeCustomerId: { type: String, trim: true, maxlength: 255, index: true, sparse: true },
  stripeSubscriptionId: { type: String, trim: true, maxlength: 255, index: true, sparse: true },
  stripeCheckoutSessionId: { type: String, trim: true, maxlength: 255, index: true, sparse: true },
  stripePriceId: { type: String, trim: true, maxlength: 255 },
  stripeSubscriptionStatus: { type: String, trim: true, maxlength: 80 },
  stripeLastEventId: { type: String, trim: true, maxlength: 255 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  startsAt: Date,
  expiresAt: Date,
  cancelledAt: Date
}, { timestamps: true });

sellerMembershipSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.models.SellerMembership || mongoose.model('SellerMembership', sellerMembershipSchema);
