const mongoose = require('mongoose');
const { notifySellerActivation } = require('../services/adminNotificationEmailService');

const sellerMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  plan: { type: String, enum: ['SELLER_FREE','SELLER_MONTHLY'], default: 'SELLER_FREE' },
  status: { type: String, enum: ['PENDING_PAYMENT','ACTIVE','EXPIRED','SUSPENDED','CANCELLED'], default: 'ACTIVE', index: true },
  priceAmount: { type: Number, min: 0, required: true, default: 0 },
  priceCurrency: { type: String, enum: ['EUR'], default: 'EUR' },
  billingReference: { type: String, trim: true, maxlength: 200 },
  paymentReference: { type: String, trim: true, maxlength: 300 },
  paymentProvider: { type: String, enum: ['NONE','MANUAL','STRIPE'], default: 'NONE', index: true },
  acceptedCryptoCurrencies: { type: [{ type:String, enum:['XMR','BTC','ETH'] }], default: ['XMR'] },
  preferredSettlementCurrency: { type:String, enum:['XMR','BTC','ETH'], default:'XMR' },
  cryptoConversionEnabled: { type:Boolean, default:false },
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

sellerMembershipSchema.pre('findOneAndUpdate', async function sellerActivationNotificationState() {
  const update = this.getUpdate() || {};
  const set = update.$set || {};
  this._notifySellerActivation = false;
  if (set.plan !== 'SELLER_FREE' || set.status !== 'ACTIVE' || set.paymentProvider !== 'NONE') return;
  const existing = await this.model.findOne(this.getQuery()).lean();
  this._notifySellerActivation = !existing || existing.plan !== 'SELLER_FREE' || existing.status !== 'ACTIVE';
});

sellerMembershipSchema.post('findOneAndUpdate', function sendSellerActivationNotification(membership) {
  if (!this._notifySellerActivation || !membership) return;
  void notifySellerActivation({
    userId: membership.userId,
    plan: membership.plan
  });
});

module.exports = mongoose.models.SellerMembership || mongoose.model('SellerMembership', sellerMembershipSchema);
