'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const METRIC_TYPES = Object.freeze({
  VISIT: 'VISIT',
  QUALIFIED_LEAD: 'QUALIFIED_LEAD',
  SALE: 'SALE',
  REFUND: 'REFUND',
  SUPPORT_REQUEST: 'SUPPORT_REQUEST'
});

const metricEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, default: () => `zdm_${crypto.randomUUID()}` },
  ownerId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  metricType: { type: String, required: true, enum: Object.values(METRIC_TYPES), index: true },
  quantity: { type: Number, required: true, min: 1 },
  amountMinor: { type: Number, default: null, min: 0 },
  currency: { type: String, default: null, uppercase: true, trim: true },
  sourceReference: { type: String, required: true, trim: true },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

metricEventSchema.index({ ownerId: 1, projectId: 1, sourceReference: 1 }, { unique: true });
metricEventSchema.index({ ownerId: 1, projectId: 1, occurredAt: -1 });

const ZorgaxDigitalProductMetricEvent = mongoose.models.ZorgaxDigitalProductMetricEvent ||
  mongoose.model('ZorgaxDigitalProductMetricEvent', metricEventSchema);

module.exports = { METRIC_TYPES, ZorgaxDigitalProductMetricEvent };
