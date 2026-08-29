'use strict';

const {
  ECONOMIC_ENTRY_TYPES,
  ECONOMIC_SOURCE_TYPES,
  ZorgaxEconomicLedgerEntry
} = require('../models/ZorgaxEconomicLedgerEntry');
const {
  normalizeAsset,
  normalizeNetwork,
  recordEconomicEntry,
  requireNonEmptyString,
  requireSafePositiveInteger
} = require('./zorgaxAccountingService');

function normalizeOccurredAt(value) {
  const occurredAt = value === undefined || value === null || value === ''
    ? new Date()
    : new Date(value);
  if (Number.isNaN(occurredAt.getTime())) throw new Error('occurredAt must be a valid date');
  return occurredAt;
}

function safeAdd(current, delta, field) {
  const next = current + delta;
  if (!Number.isSafeInteger(next)) throw new Error(`${field} exceeds safe integer range`);
  return next;
}

async function recordExpense({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  asset,
  network = null,
  amountMinor,
  expenseReference,
  description = null,
  occurredAt = new Date(),
  recordedBy = null,
  metadata = {}
}) {
  const reference = requireNonEmptyString(expenseReference, 'expenseReference');
  return recordEconomicEntry({
    LedgerModel,
    ownerId,
    type: ECONOMIC_ENTRY_TYPES.EXPENSE_RECOGNIZED,
    asset,
    network,
    amountMinor,
    sourceType: ECONOMIC_SOURCE_TYPES.MANUAL,
    sourceReference: `expense:${reference}`,
    description,
    occurredAt: normalizeOccurredAt(occurredAt),
    metadata: {
      ...metadata,
      expenseReference: reference,
      recordedBy: recordedBy ? String(recordedBy) : null,
      accountingOperation: 'expense_recognition_v1'
    }
  });
}

async function accrueLiability({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  asset,
  network = null,
  amountMinor,
  liabilityReference,
  description = null,
  occurredAt = new Date(),
  recordedBy = null,
  metadata = {}
}) {
  const reference = requireNonEmptyString(liabilityReference, 'liabilityReference');
  return recordEconomicEntry({
    LedgerModel,
    ownerId,
    type: ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED,
    asset,
    network,
    amountMinor,
    sourceType: ECONOMIC_SOURCE_TYPES.MANUAL,
    sourceReference: `liability:accrue:${reference}`,
    description,
    occurredAt: normalizeOccurredAt(occurredAt),
    metadata: {
      ...metadata,
      liabilityReference: reference,
      recordedBy: recordedBy ? String(recordedBy) : null,
      accountingOperation: 'liability_accrual_v1'
    }
  });
}

async function getLiabilityPosition({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  asset,
  network = null,
  liabilityReference
}) {
  if (!LedgerModel || typeof LedgerModel.find !== 'function') {
    throw new Error('LedgerModel is required');
  }

  const normalizedOwnerId = requireNonEmptyString(ownerId, 'ownerId');
  const normalizedAsset = normalizeAsset(asset);
  const normalizedNetwork = normalizeNetwork(network);
  const reference = requireNonEmptyString(liabilityReference, 'liabilityReference');

  const rows = await LedgerModel.find({
    ownerId: normalizedOwnerId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    'metadata.liabilityReference': reference,
    type: { $in: [ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED, ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED] }
  }).select('type amountMinor sourceReference occurredAt metadata').sort({ occurredAt: 1, createdAt: 1 }).lean();

  let accruedMinor = 0;
  let settledMinor = 0;
  for (const row of rows) {
    const amount = requireSafePositiveInteger(row.amountMinor, 'liability amountMinor');
    if (row.type === ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED) {
      accruedMinor = safeAdd(accruedMinor, amount, 'liability accrued total');
    } else if (row.type === ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED) {
      settledMinor = safeAdd(settledMinor, amount, 'liability settled total');
    }
  }

  if (settledMinor > accruedMinor) {
    throw new Error('liability ledger is over-settled');
  }

  return {
    ownerId: normalizedOwnerId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    liabilityReference: reference,
    accruedMinor,
    settledMinor,
    outstandingMinor: accruedMinor - settledMinor,
    entryCount: rows.length
  };
}

async function settleLiability({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  asset,
  network = null,
  amountMinor,
  liabilityReference,
  settlementReference,
  description = null,
  occurredAt = new Date(),
  recordedBy = null,
  metadata = {}
}) {
  const reference = requireNonEmptyString(liabilityReference, 'liabilityReference');
  const settlement = requireNonEmptyString(settlementReference, 'settlementReference');
  const amount = requireSafePositiveInteger(amountMinor, 'amountMinor');

  const position = await getLiabilityPosition({
    LedgerModel,
    ownerId,
    asset,
    network,
    liabilityReference: reference
  });

  if (position.accruedMinor === 0) throw new Error('liability not found');
  if (amount > position.outstandingMinor) throw new Error('liability settlement exceeds outstanding amount');

  const entry = await recordEconomicEntry({
    LedgerModel,
    ownerId,
    type: ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED,
    asset,
    network,
    amountMinor: amount,
    sourceType: ECONOMIC_SOURCE_TYPES.MANUAL,
    sourceReference: `liability:settle:${reference}:${settlement}`,
    description,
    occurredAt: normalizeOccurredAt(occurredAt),
    metadata: {
      ...metadata,
      liabilityReference: reference,
      settlementReference: settlement,
      recordedBy: recordedBy ? String(recordedBy) : null,
      accountingOperation: 'liability_settlement_v1'
    }
  });

  const updated = await getLiabilityPosition({
    LedgerModel,
    ownerId,
    asset,
    network,
    liabilityReference: reference
  });

  return { entry, liability: updated };
}

module.exports = {
  accrueLiability,
  getLiabilityPosition,
  normalizeOccurredAt,
  recordExpense,
  settleLiability
};
