'use strict';

const {
  ECONOMIC_ENTRY_TYPES,
  ZorgaxEconomicLedgerEntry
} = require('../models/ZorgaxEconomicLedgerEntry');
const {
  normalizeAsset,
  normalizeNetwork,
  requireNonEmptyString,
  requireSafePositiveInteger
} = require('./zorgaxAccountingService');

function requireSafeNonNegativeInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return parsed;
}

function safeAdd(current, delta, field) {
  const next = current + delta;
  if (!Number.isSafeInteger(next)) throw new Error(`${field} exceeds safe integer range`);
  return next;
}

function applyEntry(totals, entry) {
  const amount = requireSafePositiveInteger(entry.amountMinor, 'ledger amountMinor');

  switch (entry.type) {
    case ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED:
      totals.recognizedRevenueMinor = safeAdd(totals.recognizedRevenueMinor, amount, 'recognized revenue');
      totals.treasuryBalanceMinor = safeAdd(totals.treasuryBalanceMinor, amount, 'treasury balance');
      break;
    case ECONOMIC_ENTRY_TYPES.EXPENSE_RECOGNIZED:
      totals.recognizedExpensesMinor = safeAdd(totals.recognizedExpensesMinor, amount, 'recognized expenses');
      totals.treasuryBalanceMinor = safeAdd(totals.treasuryBalanceMinor, -amount, 'treasury balance');
      break;
    case ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED:
      totals.outstandingLiabilitiesMinor = safeAdd(totals.outstandingLiabilitiesMinor, amount, 'outstanding liabilities');
      break;
    case ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED:
      totals.outstandingLiabilitiesMinor = safeAdd(totals.outstandingLiabilitiesMinor, -amount, 'outstanding liabilities');
      totals.treasuryBalanceMinor = safeAdd(totals.treasuryBalanceMinor, -amount, 'treasury balance');
      break;
    case ECONOMIC_ENTRY_TYPES.TREASURY_INFLOW:
      totals.treasuryBalanceMinor = safeAdd(totals.treasuryBalanceMinor, amount, 'treasury balance');
      break;
    case ECONOMIC_ENTRY_TYPES.TREASURY_OUTFLOW:
      totals.treasuryBalanceMinor = safeAdd(totals.treasuryBalanceMinor, -amount, 'treasury balance');
      break;
    default:
      throw new Error(`unsupported economic entry type: ${entry.type}`);
  }
}

async function getTreasurySnapshot({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  asset,
  network = null,
  reserveMinor = 0,
  asOf = new Date()
}) {
  if (!LedgerModel || typeof LedgerModel.find !== 'function') {
    throw new Error('LedgerModel is required');
  }

  const normalizedOwnerId = requireNonEmptyString(ownerId, 'ownerId');
  const normalizedAsset = normalizeAsset(asset);
  const normalizedNetwork = normalizeNetwork(network);
  const normalizedReserveMinor = requireSafeNonNegativeInteger(reserveMinor, 'reserveMinor');
  const normalizedAsOf = new Date(asOf);
  if (Number.isNaN(normalizedAsOf.getTime())) throw new Error('asOf must be a valid date');

  const filter = {
    ownerId: normalizedOwnerId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    occurredAt: { $lte: normalizedAsOf }
  };

  const entries = await LedgerModel.find(filter)
    .select('type amountMinor occurredAt sourceType sourceReference')
    .sort({ occurredAt: 1, createdAt: 1 })
    .lean();

  const totals = {
    recognizedRevenueMinor: 0,
    recognizedExpensesMinor: 0,
    outstandingLiabilitiesMinor: 0,
    treasuryBalanceMinor: 0
  };

  for (const entry of entries) applyEntry(totals, entry);

  if (totals.outstandingLiabilitiesMinor < 0) {
    throw new Error('ledger produces negative outstanding liabilities');
  }

  const profitMinor = safeAdd(
    totals.recognizedRevenueMinor,
    -totals.recognizedExpensesMinor,
    'recognized profit'
  );

  const capitalBeforeReserveMinor = Math.max(
    0,
    safeAdd(totals.treasuryBalanceMinor, -totals.outstandingLiabilitiesMinor, 'capital before reserve')
  );

  const investableCapitalMinor = Math.max(
    0,
    safeAdd(capitalBeforeReserveMinor, -normalizedReserveMinor, 'investable capital')
  );

  return {
    ownerId: normalizedOwnerId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    asOf: normalizedAsOf,
    entryCount: entries.length,
    recognizedRevenueMinor: totals.recognizedRevenueMinor,
    recognizedExpensesMinor: totals.recognizedExpensesMinor,
    recognizedProfitMinor: profitMinor,
    outstandingLiabilitiesMinor: totals.outstandingLiabilitiesMinor,
    treasuryBalanceMinor: totals.treasuryBalanceMinor,
    reserveMinor: normalizedReserveMinor,
    capitalBeforeReserveMinor,
    investableCapitalMinor,
    accountingBasis: 'zorgax_economic_ledger_v1',
    caveat: 'This is a MyZubster operational accounting snapshot, not audited statutory or tax accounting.'
  };
}

module.exports = {
  applyEntry,
  getTreasurySnapshot,
  requireSafeNonNegativeInteger,
  safeAdd
};
