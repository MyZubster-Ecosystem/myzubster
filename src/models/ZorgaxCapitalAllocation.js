'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const ALLOCATION_STATUSES = Object.freeze({
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FUNDED: 'FUNDED',
  MEASURING: 'MEASURING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

const ALLOCATION_CATEGORIES = Object.freeze({
  RESERVE: 'RESERVE',
  SECURITY: 'SECURITY',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  AI_RESEARCH: 'AI_RESEARCH',
  DEVELOPER_ECOSYSTEM: 'DEVELOPER_ECOSYSTEM',
  GROWTH: 'GROWTH',
  MARKETPLACE: 'MARKETPLACE',
  LIFE_ENVIRONMENT: 'LIFE_ENVIRONMENT',
  IOT_ROBOTICS: 'IOT_ROBOTICS',
  OPERATIONS: 'OPERATIONS',
  OTHER: 'OTHER'
});

const capitalAllocationSchema = new mongoose.Schema({
  allocationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `zca_${crypto.randomUUID()}`
  },
  ownerId: { type: String, required: true, index: true },
  cycleReference: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: Object.values(ALLOCATION_CATEGORIES)
  },
  title: { type: String, required: true, trim: true },
  rationale: { type: String, required: true, trim: true },
  asset: { type: String, required: true, uppercase: true, trim: true },
  amountMinor: { type: Number, required: true, min: 1 },
  availableCapitalMinor: { type: Number, required: true, min: 1 },
  expectedFinancialReturnBps: { type: Number, default: 0 },
  scores: {
    financialReturn: { type: Number, required: true, min: 0, max: 100 },
    ecosystemGrowth: { type: Number, required: true, min: 0, max: 100 },
    userGrowth: { type: Number, required: true, min: 0, max: 100 },
    developerGrowth: { type: Number, required: true, min: 0, max: 100 },
    infrastructureValue: { type: Number, required: true, min: 0, max: 100 },
    strategicValue: { type: Number, required: true, min: 0, max: 100 },
    environmentalImpact: { type: Number, required: true, min: 0, max: 100 },
    risk: { type: Number, required: true, min: 0, max: 100 },
    liquidityCost: { type: Number, required: true, min: 0, max: 100 },
    opportunityScore: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: Object.values(ALLOCATION_STATUSES),
    default: ALLOCATION_STATUSES.PROPOSED,
    index: true
  },
  advisoryOnly: { type: Boolean, default: true, immutable: true },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  measuredReturnMinor: { type: Number, default: null },
  outcome: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

capitalAllocationSchema.index(
  { ownerId: 1, cycleReference: 1, category: 1 },
  { unique: true }
);

const ZorgaxCapitalAllocation = mongoose.models.ZorgaxCapitalAllocation ||
  mongoose.model('ZorgaxCapitalAllocation', capitalAllocationSchema);

module.exports = {
  ALLOCATION_CATEGORIES,
  ALLOCATION_STATUSES,
  ZorgaxCapitalAllocation
};
