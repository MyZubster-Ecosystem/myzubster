'use strict';

const { METRIC_TYPES, ZorgaxDigitalProductMetricEvent } = require('../models/ZorgaxDigitalProductMetricEvent');

function requireNonEmptyString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function requireSafePositiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${field} must be a safe positive integer`);
  return value;
}

function normalizeMetricType(value) {
  const normalized = requireNonEmptyString(value, 'metricType').toUpperCase();
  if (!Object.values(METRIC_TYPES).includes(normalized)) throw new Error('invalid metricType');
  return normalized;
}

function publicMetricEvent(item) {
  const row = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!row) return null;
  const { _id, __v, ...rest } = row;
  return rest;
}

async function recordMetricEvent({
  MetricModel = ZorgaxDigitalProductMetricEvent,
  ownerId,
  projectId,
  metricType,
  quantity = 1,
  amountMinor = null,
  currency = null,
  sourceReference,
  occurredAt = new Date(),
  metadata = {}
}) {
  const normalizedOwnerId = requireNonEmptyString(ownerId, 'ownerId');
  const normalizedProjectId = requireNonEmptyString(projectId, 'projectId');
  const normalizedMetricType = normalizeMetricType(metricType);
  const normalizedSourceReference = requireNonEmptyString(sourceReference, 'sourceReference');
  const normalizedQuantity = requireSafePositiveInteger(quantity, 'quantity');

  if (amountMinor !== null && (!Number.isSafeInteger(amountMinor) || amountMinor < 0)) {
    throw new Error('amountMinor must be a safe non-negative integer');
  }
  const normalizedCurrency = currency == null ? null : requireNonEmptyString(currency, 'currency').toUpperCase();
  if ([METRIC_TYPES.SALE, METRIC_TYPES.REFUND].includes(normalizedMetricType)) {
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new Error('sale/refund amountMinor is required');
    if (!normalizedCurrency) throw new Error('sale/refund currency is required');
  }

  const query = { ownerId: normalizedOwnerId, projectId: normalizedProjectId, sourceReference: normalizedSourceReference };
  const existing = await MetricModel.findOne(query);
  if (existing) {
    if (existing.metricType !== normalizedMetricType || existing.quantity !== normalizedQuantity || existing.amountMinor !== amountMinor || (existing.currency || null) !== normalizedCurrency) {
      throw new Error('metric source reference already exists with different data');
    }
    return { event: publicMetricEvent(existing), replay: true };
  }

  const created = await MetricModel.create({ ...query, metricType: normalizedMetricType, quantity: normalizedQuantity, amountMinor, currency: normalizedCurrency, occurredAt, metadata: metadata && typeof metadata === 'object' ? metadata : {} });
  return { event: publicMetricEvent(created), replay: false };
}

function safeAdd(a, b) {
  const result = a + b;
  if (!Number.isSafeInteger(result)) throw new Error('metric total exceeds safe integer range');
  return result;
}

async function getMetricSnapshot({ MetricModel = ZorgaxDigitalProductMetricEvent, ownerId, projectId, currency = null }) {
  const query = { ownerId: requireNonEmptyString(ownerId, 'ownerId'), projectId: requireNonEmptyString(projectId, 'projectId') };
  const rows = await MetricModel.find(query).sort({ occurredAt: 1 }).lean();
  const normalizedCurrency = currency == null ? null : requireNonEmptyString(currency, 'currency').toUpperCase();
  const totals = { visits: 0, qualifiedLeads: 0, sales: 0, refunds: 0, supportRequests: 0, grossRevenueMinor: 0, refundedMinor: 0 };

  for (const row of rows) {
    if (row.metricType === METRIC_TYPES.VISIT) totals.visits = safeAdd(totals.visits, row.quantity);
    if (row.metricType === METRIC_TYPES.QUALIFIED_LEAD) totals.qualifiedLeads = safeAdd(totals.qualifiedLeads, row.quantity);
    if (row.metricType === METRIC_TYPES.SUPPORT_REQUEST) totals.supportRequests = safeAdd(totals.supportRequests, row.quantity);
    if (row.metricType === METRIC_TYPES.SALE) {
      totals.sales = safeAdd(totals.sales, row.quantity);
      if (!normalizedCurrency || row.currency === normalizedCurrency) totals.grossRevenueMinor = safeAdd(totals.grossRevenueMinor, row.amountMinor || 0);
    }
    if (row.metricType === METRIC_TYPES.REFUND) {
      totals.refunds = safeAdd(totals.refunds, row.quantity);
      if (!normalizedCurrency || row.currency === normalizedCurrency) totals.refundedMinor = safeAdd(totals.refundedMinor, row.amountMinor || 0);
    }
  }

  const conversionRateBps = totals.visits > 0 ? Math.round((totals.sales / totals.visits) * 10000) : 0;
  const leadConversionRateBps = totals.qualifiedLeads > 0 ? Math.round((totals.sales / totals.qualifiedLeads) * 10000) : 0;
  const refundRateBps = totals.sales > 0 ? Math.round((totals.refunds / totals.sales) * 10000) : 0;
  const netRevenueMinor = totals.grossRevenueMinor - totals.refundedMinor;

  return { projectId: query.projectId, currency: normalizedCurrency, eventCount: rows.length, ...totals, netRevenueMinor, conversionRateBps, leadConversionRateBps, refundRateBps, accountingIntegrated: false, caveat: 'Revenue metrics are product observations, not recognized accounting revenue. Do not treat this snapshot as statutory or treasury accounting.' };
}

function buildLearningReport(snapshot) {
  const recommendations = [];
  if (snapshot.visits < 100) recommendations.push('Collect more traffic before drawing strong conversion conclusions.');
  if (snapshot.qualifiedLeads === 0) recommendations.push('Add a qualified-lead signal so Zorgax can distinguish traffic from actual buyer interest.');
  if (snapshot.sales === 0) recommendations.push('Investigate offer clarity, target fit, price hypothesis and customer objections before expanding scope.');
  if (snapshot.sales > 0 && snapshot.refundRateBps >= 1000) recommendations.push('Review expectation-setting, product quality and support because refund rate is elevated.');
  if (snapshot.supportRequests > snapshot.sales && snapshot.sales > 0) recommendations.push('Support load is high relative to sales; improve onboarding, FAQ and product clarity.');
  if (snapshot.sales >= 3 && snapshot.refundRateBps < 1000) recommendations.push('Preserve the current winning assumptions and test one change at a time rather than changing the whole offer.');

  return {
    projectId: snapshot.projectId,
    generatedAt: new Date().toISOString(),
    version: 'zorgax_digital_product_learning_v1',
    advisoryOnly: true,
    predictsFutureSales: false,
    evidenceBasis: { eventCount: snapshot.eventCount, visits: snapshot.visits, qualifiedLeads: snapshot.qualifiedLeads, sales: snapshot.sales, refunds: snapshot.refunds, supportRequests: snapshot.supportRequests },
    funnel: { conversionRateBps: snapshot.conversionRateBps, leadConversionRateBps: snapshot.leadConversionRateBps, refundRateBps: snapshot.refundRateBps },
    recommendations,
    caveat: 'Recommendations are bounded heuristics over recorded pilot metrics. Small samples, tracking errors and selection bias can make results misleading.'
  };
}

module.exports = { METRIC_TYPES, buildLearningReport, getMetricSnapshot, normalizeMetricType, publicMetricEvent, recordMetricEvent };
