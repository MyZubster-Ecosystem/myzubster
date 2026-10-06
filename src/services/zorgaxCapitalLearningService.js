'use strict';

const { ALLOCATION_STATUSES } = require('../models/ZorgaxCapitalAllocation');
const { requireSafeInteger } = require('./zorgaxCapitalDecisionService');

const MAX_SCORE_ADJUSTMENT = 12;
const MIN_COMPLETED_SAMPLES = 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeAverage(total, count) {
  return count > 0 ? total / count : 0;
}

function summarizeCompletedAllocations(rows) {
  const byCategory = new Map();

  for (const row of rows) {
    if (!row || row.status !== ALLOCATION_STATUSES.COMPLETED) continue;
    if (!Number.isSafeInteger(row.spentMinor) || row.spentMinor <= 0) continue;
    if (!Number.isSafeInteger(row.measuredReturnMinor)) continue;

    const category = String(row.category || 'OTHER');
    const bucket = byCategory.get(category) || {
      category,
      completedCount: 0,
      successfulCount: 0,
      totalSpentMinor: 0,
      totalMeasuredReturnMinor: 0,
      totalRealizedReturnBps: 0
    };

    const realizedReturnBps = Number.isSafeInteger(row.realizedReturnBps)
      ? row.realizedReturnBps
      : Math.round(((row.measuredReturnMinor - row.spentMinor) / row.spentMinor) * 10000);

    requireSafeInteger(realizedReturnBps, 'realizedReturnBps');

    bucket.completedCount += 1;
    bucket.successfulCount += realizedReturnBps > 0 ? 1 : 0;
    bucket.totalSpentMinor += row.spentMinor;
    bucket.totalMeasuredReturnMinor += row.measuredReturnMinor;
    bucket.totalRealizedReturnBps += realizedReturnBps;

    if (!Number.isSafeInteger(bucket.totalSpentMinor) || !Number.isSafeInteger(bucket.totalMeasuredReturnMinor)) {
      throw new Error('capital learning totals exceed safe integer range');
    }

    byCategory.set(category, bucket);
  }

  return Array.from(byCategory.values()).map((bucket) => ({
    ...bucket,
    averageRealizedReturnBps: Math.round(safeAverage(bucket.totalRealizedReturnBps, bucket.completedCount)),
    successRateBps: Math.round((bucket.successfulCount / bucket.completedCount) * 10000)
  }));
}

function adjustmentFromSummary(summary) {
  if (!summary || summary.completedCount < MIN_COMPLETED_SAMPLES) {
    return { adjustment: 0, evidenceLevel: 'insufficient' };
  }

  const roiComponent = clamp(summary.averageRealizedReturnBps / 1000, -8, 8);
  const successComponent = clamp((summary.successRateBps - 5000) / 1250, -4, 4);
  const adjustment = clamp(Math.round(roiComponent + successComponent), -MAX_SCORE_ADJUSTMENT, MAX_SCORE_ADJUSTMENT);

  return {
    adjustment,
    evidenceLevel: summary.completedCount >= 5 ? 'moderate' : 'limited'
  };
}

function applyLearningToOpportunities(opportunities, summaries) {
  const summaryByCategory = new Map((summaries || []).map((item) => [String(item.category), item]));

  return opportunities.map((opportunity) => {
    const summary = summaryByCategory.get(String(opportunity.category));
    const learning = adjustmentFromSummary(summary);
    const scores = { ...opportunity.scores };

    // Learning is deliberately narrow: only the financial-return score is adjusted.
    // Risk, liquidity, reserves, allocation caps and all other policy dimensions remain unchanged.
    scores.financialReturn = clamp(Number(scores.financialReturn) + learning.adjustment, 0, 100);

    return {
      ...opportunity,
      scores,
      learning: {
        applied: learning.adjustment !== 0,
        financialReturnAdjustment: learning.adjustment,
        evidenceLevel: learning.evidenceLevel,
        completedCount: summary?.completedCount || 0,
        averageRealizedReturnBps: summary?.averageRealizedReturnBps ?? null,
        successRateBps: summary?.successRateBps ?? null,
        boundedBy: MAX_SCORE_ADJUSTMENT
      }
    };
  });
}

async function getLearningSnapshot({ AllocationModel, ownerId, limit = 1000 }) {
  if (!AllocationModel || typeof AllocationModel.find !== 'function') {
    throw new Error('AllocationModel is required');
  }

  const rows = await AllocationModel.find({
    ownerId: String(ownerId),
    status: ALLOCATION_STATUSES.COMPLETED
  }).sort({ completedAt: -1 }).limit(Math.max(1, Math.min(Number(limit) || 1000, 5000))).lean();

  const categories = summarizeCompletedAllocations(rows);
  return {
    completedAllocationCount: categories.reduce((sum, item) => sum + item.completedCount, 0),
    categories,
    guardrails: {
      maxFinancialReturnScoreAdjustment: MAX_SCORE_ADJUSTMENT,
      minimumSamplesBeforeAdjustment: MIN_COMPLETED_SAMPLES,
      modifiesRiskScore: false,
      modifiesReserve: false,
      modifiesMaxAllocation: false
    }
  };
}

module.exports = {
  MAX_SCORE_ADJUSTMENT,
  MIN_COMPLETED_SAMPLES,
  adjustmentFromSummary,
  applyLearningToOpportunities,
  getLearningSnapshot,
  summarizeCompletedAllocations
};
