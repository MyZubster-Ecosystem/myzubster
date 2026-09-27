const mongoose = require('mongoose');

// Only daily totals are retained. No message text, user ID or session ID is stored.
const schema = new mongoose.Schema({
  day: { type: String, required: true },
  topic: { type: String, required: true },
  count: { type: Number, default: 0 }
});
schema.index({ day: 1, topic: 1 }, { unique: true });

module.exports = mongoose.models.ZorgaxTopicDaily || mongoose.model('ZorgaxTopicDaily', schema);
