const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String, enum: ['zorgax', 'github', 'life', 'marketplace', 'contributors'], required: true, index: true },
  template: { type: String, required: true, trim: true, maxlength: 120 },
  subject: { type: String, required: true, trim: true, maxlength: 180 },
  text: { type: String, required: true, trim: true, maxlength: 12000 },
  status: { type: String, enum: ['QUEUED', 'SENT', 'SKIPPED', 'FAILED'], default: 'QUEUED', index: true },
  reason: { type: String, trim: true, maxlength: 500 },
  sentAt: { type: Date }
}, { timestamps: true });

schema.index({ status: 1, createdAt: 1 });
module.exports = mongoose.models.ZorgaxEmailDelivery || mongoose.model('ZorgaxEmailDelivery', schema);
