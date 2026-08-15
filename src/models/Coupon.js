const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed', 'free_ride'], required: true },
  discountValue: { type: Number, required: true },
  minMYZ: { type: Number, required: true },
  maxUses: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  redeemedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
