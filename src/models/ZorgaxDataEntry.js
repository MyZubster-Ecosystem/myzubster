const mongoose = require('mongoose');

const ZorgaxDataEntrySchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: 'zorgax_user_confirmed', maxlength: 120 },
  confirmationDigest: { type: String, required: true, maxlength: 64 },
  createdBy: { type: String, default: null, maxlength: 120 }
}, { timestamps: true });

ZorgaxDataEntrySchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.models.ZorgaxDataEntry || mongoose.model('ZorgaxDataEntry', ZorgaxDataEntrySchema);
