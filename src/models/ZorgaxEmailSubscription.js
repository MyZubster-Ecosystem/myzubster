const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  enabled: { type: Boolean, default: false, index: true },
  topics: [{ type: String, enum: ['zorgax', 'github', 'life', 'marketplace', 'contributors'] }],
  source: { type: String, enum: ['github-verified-email', 'google-verified-email', 'account-email'], default: 'account-email' },
  consentedAt: { type: Date },
  unsubscribedAt: { type: Date },
  lastSentAt: { type: Date },
  sendCount30d: { type: Number, default: 0 },
  frequency: { type: String, enum: ['important-only', 'weekly'], default: 'important-only' }
}, { timestamps: true });

schema.index({ enabled: 1, topics: 1, lastSentAt: 1 });
module.exports = mongoose.models.ZorgaxEmailSubscription || mongoose.model('ZorgaxEmailSubscription', schema);
