'use strict';

const mongoose = require('mongoose');

const ResearchDocumentSchema = new mongoose.Schema(
  {
    normalizedUrl: { type: String, required: true, unique: true, index: true },
    sourceType: { type: String, enum: ['web', 'onion'], required: true, index: true },
    host: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    snippet: { type: String, default: '' },
    contentHash: { type: String, required: true },
    contentType: { type: String, default: '' },
    statusCode: { type: Number, default: 200 },
    depth: { type: Number, default: 0 },
    crawledAt: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ResearchDocumentSchema.index({ title: 'text', text: 'text' }, { weights: { title: 8, text: 1 }, name: 'research_text' });
ResearchDocumentSchema.index({ sourceType: 1, crawledAt: -1 });

module.exports = mongoose.models.ResearchDocument || mongoose.model('ResearchDocument', ResearchDocumentSchema);
