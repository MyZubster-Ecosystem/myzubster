const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 160 },
  url: { type: String, trim: true, maxlength: 1000 },
  note: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  domain: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  evidence: { type: [evidenceSchema], default: [] },
  verificationNote: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  publishedAt: { type: Date },
  publisherName: { type: String, trim: true, maxlength: 30 }
}, { timestamps: true });

schema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model('KnowledgeDraft', schema);
