const mongoose = require('mongoose');

const marketplaceReportSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, enum: ['prohibited_item','fraud','spam','harassment','unsafe','other'], required: true },
  details: { type: String, default: '', maxlength: 1500 },
  status: { type: String, enum: ['OPEN','REVIEWED','RESOLVED','DISMISSED'], default: 'OPEN', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, default: '', maxlength: 1500 },
  reviewedAt: { type: Date, default: null },
  listingAction: { type: String, enum: ['none','pause','close','activate'], default: 'none' }
}, { timestamps: true });

marketplaceReportSchema.index({ listingId: 1, reporterId: 1 }, { unique: true });
marketplaceReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.MarketplaceReport || mongoose.model('MarketplaceReport', marketplaceReportSchema);
