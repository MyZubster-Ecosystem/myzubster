const mongoose = require('mongoose');

const marketplaceReviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 1200 }
}, { timestamps: true });

marketplaceReviewSchema.index({ orderId: 1, authorId: 1 }, { unique: true });
marketplaceReviewSchema.index({ subjectId: 1, createdAt: -1 });

module.exports = mongoose.models.MarketplaceReview || mongoose.model('MarketplaceReview', marketplaceReviewSchema);
