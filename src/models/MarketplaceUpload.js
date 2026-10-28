const mongoose = require('mongoose');

const marketplaceUploadSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mimeType: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' }
}, { timestamps: true });

marketplaceUploadSchema.index({ ownerId: 1, url: 1 });

module.exports = mongoose.models.MarketplaceUpload || mongoose.model('MarketplaceUpload', marketplaceUploadSchema);
