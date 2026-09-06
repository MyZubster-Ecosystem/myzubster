const mongoose = require('mongoose');

const zorgaxPartyNoticeSchema = new mongoose.Schema({
  noticeId: { type: String, required: true, unique: true, index: true },
  text: { type: String, required: true, maxlength: 280 },
  status: { type: String, required: true, enum: ['published'], default: 'published' },
  publishedByUserId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
}, { versionKey: false });

module.exports = mongoose.models.ZorgaxPartyNotice
  || mongoose.model('ZorgaxPartyNotice', zorgaxPartyNoticeSchema);
