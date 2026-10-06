'use strict';

const {
  ALLOCATION_STATUSES,
  ZorgaxCapitalAllocation
} = require('../models/ZorgaxCapitalAllocation');
const {
  requireSafeNonNegativeInteger
} = require('./zorgaxCapitalAllocatorService');

function requireNonEmptyString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function requireSafePositiveInteger(value, field) {
  requireSafeNonNegativeInteger(value, field);
  if (value === 0) throw new Error(`${field} must be greater than zero`);
  return value;
}

function requireSafeInteger(value, field) {
  if (!Number.isSafeInteger(value)) throw new Error(`${field} must be a safe integer`);
  return value;
}

function publicAllocation(item) {
  const row = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!row) return null;
  const { _id, __v, ...rest } = row;
  return rest;
}

async function findOwnedAllocation({ AllocationModel, ownerId, allocationId }) {
  const item = await AllocationModel.findOne({
    ownerId: requireNonEmptyString(ownerId, 'ownerId'),
    allocationId: requireNonEmptyString(allocationId, 'allocationId')
  });
  if (!item) throw new Error('capital allocation not found');
  return item;
}

async function recordRecommendations({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  cycleReference,
  asset,
  network = null,
  recommendations,
  metadata = {}
}) {
  const normalizedOwner = requireNonEmptyString(ownerId, 'ownerId');
  const normalizedCycle = requireNonEmptyString(cycleReference, 'cycleReference');
  const normalizedAsset = requireNonEmptyString(asset, 'asset').toUpperCase();
  if (!Array.isArray(recommendations)) throw new Error('recommendations must be an array');

  const saved = [];
  for (const recommendation of recommendations) {
    const opportunityId = requireNonEmptyString(recommendation.id, 'recommendation.id');
    let item = await AllocationModel.findOne({
      ownerId: normalizedOwner,
      cycleReference: normalizedCycle,
      opportunityId
    });

    if (!item) {
      try {
        item = await AllocationModel.create({
          ownerId: normalizedOwner,
          cycleReference: normalizedCycle,
          opportunityId,
          category: recommendation.category,
          title: requireNonEmptyString(recommendation.title, 'recommendation.title'),
          rationale: requireNonEmptyString(recommendation.rationale, 'recommendation.rationale'),
          asset: normalizedAsset,
          network: network ? String(network).trim() : null,
          amountMinor: requireSafePositiveInteger(recommendation.amountMinor, 'recommendation.amountMinor'),
          availableCapitalMinor: requireSafePositiveInteger(recommendation.availableCapitalMinor, 'recommendation.availableCapitalMinor'),
          scores: {
            ...recommendation.scores,
            opportunityScore: recommendation.opportunityScore
          },
          advisoryOnly: true,
          metadata
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        item = await AllocationModel.findOne({
          ownerId: normalizedOwner,
          cycleReference: normalizedCycle,
          opportunityId
        });
        if (!item) throw error;
      }
    }
    saved.push(publicAllocation(item));
  }

  return saved;
}

async function listAllocations({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  status = null,
  limit = 100
}) {
  const query = { ownerId: requireNonEmptyString(ownerId, 'ownerId') };
  if (status) query.status = String(status).trim().toUpperCase();
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 100, 250));
  const rows = await AllocationModel.find(query).sort({ createdAt: -1 }).limit(boundedLimit).lean();
  return rows.map(publicAllocation);
}

async function approveAllocation({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  allocationId,
  approvedBy,
  now = new Date()
}) {
  const item = await findOwnedAllocation({ AllocationModel, ownerId, allocationId });
  if (item.status === ALLOCATION_STATUSES.APPROVED) return publicAllocation(item);
  if (item.status !== ALLOCATION_STATUSES.PROPOSED) {
    throw new Error(`capital allocation cannot be approved from ${item.status}`);
  }
  item.status = ALLOCATION_STATUSES.APPROVED;
  item.approvedBy = requireNonEmptyString(approvedBy, 'approvedBy');
  item.approvedAt = now;
  await item.save();
  return publicAllocation(item);
}

async function rejectAllocation({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  allocationId,
  rejectedBy,
  now = new Date()
}) {
  const item = await findOwnedAllocation({ AllocationModel, ownerId, allocationId });
  if (item.status === ALLOCATION_STATUSES.REJECTED) return publicAllocation(item);
  if (item.status !== ALLOCATION_STATUSES.PROPOSED) {
    throw new Error(`capital allocation cannot be rejected from ${item.status}`);
  }
  item.status = ALLOCATION_STATUSES.REJECTED;
  item.rejectedBy = requireNonEmptyString(rejectedBy, 'rejectedBy');
  item.rejectedAt = now;
  await item.save();
  return publicAllocation(item);
}

async function recordSpend({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  allocationId,
  spentMinor,
  spendReference,
  now = new Date()
}) {
  const item = await findOwnedAllocation({ AllocationModel, ownerId, allocationId });
  const amount = requireSafePositiveInteger(spentMinor, 'spentMinor');
  const reference = requireNonEmptyString(spendReference, 'spendReference');

  if (item.status === ALLOCATION_STATUSES.FUNDED) {
    if (item.spentMinor === amount && item.spendReference === reference) return publicAllocation(item);
    throw new Error('capital allocation funding has already been recorded');
  }
  if (item.status !== ALLOCATION_STATUSES.APPROVED) {
    throw new Error(`capital allocation cannot record spend from ${item.status}`);
  }
  if (amount > item.amountMinor) throw new Error('spentMinor cannot exceed approved recommendation amount');

  item.status = ALLOCATION_STATUSES.FUNDED;
  item.spentMinor = amount;
  item.spendReference = reference;
  item.spentAt = now;
  await item.save();
  return publicAllocation(item);
}

async function recordOutcome({
  AllocationModel = ZorgaxCapitalAllocation,
  ownerId,
  allocationId,
  measuredReturnMinor,
  outcome,
  outcomeMetrics = {},
  now = new Date()
}) {
  const item = await findOwnedAllocation({ AllocationModel, ownerId, allocationId });
  const measured = requireSafeInteger(measuredReturnMinor, 'measuredReturnMinor');
  const normalizedOutcome = requireNonEmptyString(outcome, 'outcome');

  if (item.status === ALLOCATION_STATUSES.COMPLETED) {
    if (item.measuredReturnMinor === measured && item.outcome === normalizedOutcome) return publicAllocation(item);
    throw new Error('capital allocation outcome has already been recorded');
  }
  if (![ALLOCATION_STATUSES.FUNDED, ALLOCATION_STATUSES.MEASURING].includes(item.status)) {
    throw new Error(`capital allocation cannot record outcome from ${item.status}`);
  }
  if (!Number.isSafeInteger(item.spentMinor) || item.spentMinor <= 0) {
    throw new Error('capital allocation has no recorded spend');
  }

  const realizedReturnBps = Math.round(((measured - item.spentMinor) / item.spentMinor) * 10000);
  if (!Number.isSafeInteger(realizedReturnBps)) throw new Error('realized return exceeds safe integer range');

  item.status = ALLOCATION_STATUSES.COMPLETED;
  item.measuredReturnMinor = measured;
  item.realizedReturnBps = realizedReturnBps;
  item.outcome = normalizedOutcome;
  item.outcomeMetrics = outcomeMetrics && typeof outcomeMetrics === 'object' ? outcomeMetrics : {};
  item.completedAt = now;
  await item.save();
  return publicAllocation(item);
}

module.exports = {
  approveAllocation,
  findOwnedAllocation,
  listAllocations,
  publicAllocation,
  recordOutcome,
  recordRecommendations,
  recordSpend,
  rejectAllocation,
  requireSafeInteger,
  requireSafePositiveInteger
};
