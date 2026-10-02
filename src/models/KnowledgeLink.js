const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  sourceCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDraft', required: true },
  targetCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDraft', required: true },
  proposerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relation: { type: String, enum: ['related_to', 'builds_on', 'complements', 'uses_method'], required: true },
  note: { type: String, trim: true, maxlength: 500, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'withdrawn'], default: 'pending' },
  reviewedAt: Date
}, { timestamps: true });
schema.index({ sourceCardId: 1, targetCardId: 1, status: 1 });
schema.index({ recipientId: 1, status: 1 });
schema.index({ proposerId: 1, status: 1 });
module.exports = mongoose.model('KnowledgeLink', schema);
