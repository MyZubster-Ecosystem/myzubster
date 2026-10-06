const mongoose = require('mongoose');

const marketplaceCategoryProposalSchema = new mongoose.Schema({
  proposerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80, index: true },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true }
}, { timestamps: true });

marketplaceCategoryProposalSchema.index({ proposerId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.models.MarketplaceCategoryProposal || mongoose.model('MarketplaceCategoryProposal', marketplaceCategoryProposalSchema);
