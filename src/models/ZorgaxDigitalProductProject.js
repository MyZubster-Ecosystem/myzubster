'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const PROJECT_STATUSES = Object.freeze({
  IDEA: 'IDEA',
  VALIDATING: 'VALIDATING',
  PLANNED: 'PLANNED',
  BUILDING: 'BUILDING',
  READY_TO_LAUNCH: 'READY_TO_LAUNCH',
  LAUNCHED: 'LAUNCHED',
  MEASURING: 'MEASURING'
});

const digitalProductProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true, default: () => `zdp_${crypto.randomUUID()}` },
  ownerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  productType: { type: String, required: true, trim: true },
  targetCustomer: { type: String, default: '', trim: true },
  customerProblem: { type: String, default: '', trim: true },
  valueProposition: { type: String, default: '', trim: true },
  pricing: {
    currency: { type: String, default: 'EUR', uppercase: true, trim: true },
    amountMinor: { type: Number, default: null, min: 0 }
  },
  status: { type: String, enum: Object.values(PROJECT_STATUSES), default: PROJECT_STATUSES.IDEA, index: true },
  validation: {
    assumptions: { type: [String], default: [] },
    evidence: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    latestReport: { type: mongoose.Schema.Types.Mixed, default: null },
    latestValidatedAt: { type: Date, default: null }
  },
  blueprint: {
    latest: { type: mongoose.Schema.Types.Mixed, default: null },
    latestGeneratedAt: { type: Date, default: null }
  },
  launchChecklist: { type: [String], default: [] },
  advisoryOnly: { type: Boolean, default: true, immutable: true },
  humanApprovalRequired: { type: Boolean, default: true, immutable: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

digitalProductProjectSchema.index({ ownerId: 1, createdAt: -1 });

const ZorgaxDigitalProductProject = mongoose.models.ZorgaxDigitalProductProject ||
  mongoose.model('ZorgaxDigitalProductProject', digitalProductProjectSchema);

module.exports = { PROJECT_STATUSES, ZorgaxDigitalProductProject };
