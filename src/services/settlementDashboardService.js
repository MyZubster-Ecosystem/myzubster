'use strict';

/**
 * settlementDashboardService
 *
 * Backing data source for the payments dashboard (myzubster#306).
 *
 * Design constraint from the issue: the dashboard must model the funding flow
 * without pretending that any step happened when it did not. Therefore every
 * value in this service is derived from a canonical on-disk source, and every
 * value that cannot be derived is reported as `null` with a `reason`.
 *
 * `null` means "unknown / not derivable from a configured source".
 * `null` never means zero, and zero is never substituted for unknown.
 *
 * Funding inputs (BTC receipts, Stripe settlements) and the BTC/fiat -> XMR
 * conversion step are deliberately NOT implemented here. They are separate
 * integrations. This service exposes them through injectable providers so the
 * dashboard can render "not configured" instead of a fabricated number.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_PATHS = Object.freeze({
  ledger: 'myz/ledger.json',
  queue: 'myz/settlement-queue.json',
  policy: 'myz/settlement-policy.json'
});

/** Funding input lifecycle. BTC/Stripe are inputs only; they never approve a bounty. */
const FUNDING_STATES = Object.freeze({
  INCOMING: 'INCOMING',
  CONFIRMED: 'CONFIRMED',
  SETTLED: 'SETTLED',
  FAILED: 'FAILED'
});

/** States that count toward a spendable/available treasury balance. */
const SETTLED_FUNDING_STATES = Object.freeze([FUNDING_STATES.SETTLED]);

const CONVERSION_STATES = Object.freeze({
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'CONVERSION_PENDING',
  COMPLETED: 'CONVERSION_COMPLETED',
  FAILED: 'CONVERSION_FAILED'
});

const PAYOUT_STATES = Object.freeze({
  PENDING: 'SETTLEMENT_PENDING',
  PAYOUT_PENDING: 'XMR_PAYOUT_PENDING',
  PAID: 'XMR_PAID',
  FAILED: 'SETTLEMENT_FAILED'
});

const UNCONFIGURED = Object.freeze({
  configured: false,
  reason:
    'No funding-input repository is wired. BTC receipts and Stripe settlements must be supplied by a real funding-input adapter; unknown is not reported as zero.',
  items: [],
  totals: { incoming: null, confirmed: null, settled: null }
});

const UNCONFIGURED_CONVERSION = Object.freeze({
  configured: false,
  reason:
    'Conversion is a separate backend integration, not part of Stripe. No conversion provider is configured, so no conversion state can be reported.',
  items: []
});

const UNCONFIGURED_ESCROW = Object.freeze({
  configured: false,
  reason:
    'No bounty escrow repository is wired in this codebase (the only escrow model present is Trip, which is unrelated to bounty settlement). Escrow state is reported as unknown rather than derived from payout status.',
  items: []
});

/**
 * Reads a JSON document. Never throws: a missing or malformed source becomes a
 * reported failure so the dashboard can surface it instead of hiding it.
 */
function readSource(relativePath, { baseDir = REPO_ROOT } = {}) {
  const absolute = path.resolve(baseDir, relativePath);
  const descriptor = { name: relativePath, path: absolute, ok: false, recordCount: 0 };
  if (!fs.existsSync(absolute)) {
    return { value: null, descriptor: { ...descriptor, error: 'file not found' } };
  }
  try {
    const raw = fs.readFileSync(absolute, 'utf8');
    const value = JSON.parse(raw);
    const recordCount = Array.isArray(value?.items)
      ? value.items.length
      : Array.isArray(value?.entries)
        ? value.entries.length
        : 0;
    return { value, descriptor: { ...descriptor, ok: true, recordCount } };
  } catch (error) {
    return { value: null, descriptor: { ...descriptor, error: error.message } };
  }
}

/**
 * Entry ids neutralized by a recorded reversal.
 * A reversal only takes effect once it is itself RECORDED (see myz/LEDGER.md).
 */
function reversedEntryIds(entries = []) {
  const ids = new Set();
  for (const entry of entries) {
    if (entry?.entry_type === 'REVERSAL' && entry?.status === 'RECORDED' && entry?.reverses_entry_id) {
      ids.add(entry.reverses_entry_id);
    }
  }
  return ids;
}

/**
 * Canonical internal MYZ balance: sum of RECORDED entries not neutralized by a
 * valid reversal. This is an accounting figure, not a blockchain balance.
 *
 * A REVERSAL entry acts as a marker: it neutralizes the entry named by
 * `reverses_entry_id` and is not itself added to the sum. Adding it as well
 * would double-count the correction. Genuine negative movements
 * (ADJUSTMENT_DEBIT) are ordinary entries and are still counted.
 */
function myzBalance(ledger, accountId = null) {
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  const reversed = reversedEntryIds(entries);
  const counted = entries.filter((entry) => {
    if (entry?.status !== 'RECORDED') return false;
    if (entry?.entry_type === 'REVERSAL') return false;
    if (reversed.has(entry?.entry_id)) return false;
    if (accountId && entry?.account_id !== accountId) return false;
    return Number.isFinite(Number(entry?.amount_myz));
  });
  return round(counted.reduce((sum, entry) => sum + Number(entry.amount_myz), 0));
}

function round(value) {
  return Math.round(Number(value) * 1e6) / 1e6;
}

/** Retry posture for a settlement queue item. Idempotency is explicit, never implied. */
function payoutRetry(item = {}, { live = false } = {}) {
  const missing = [];
  if (!item.bounty_approved) missing.push('bounty is not approved');
  if (!item.myz_entry_id) missing.push('missing MYZ ledger credit');
  if (!item.xmr_address) missing.push('missing XMR payout address');
  if (!Number.isInteger(item.amount_atomic) || item.amount_atomic <= 0) missing.push('invalid XMR atomic amount');
  if (!item.evidence?.length) missing.push('missing approval evidence');

  const status = item.status;
  if (status === PAYOUT_STATES.PAID) {
    return { eligible: false, reason: 'settlement is terminal; resubmission is refused', blockingReasons: [] };
  }
  if (status === PAYOUT_STATES.PAYOUT_PENDING) {
    return {
      eligible: false,
      reason: 'payout is in flight; do not resubmit — the idempotency key guards against duplicate transfer',
      blockingReasons: []
    };
  }
  if (status === PAYOUT_STATES.FAILED) {
    return {
      eligible: missing.length === 0,
      reason:
        missing.length === 0
          ? 'failure is recoverable; the worker may retry once the blocking condition is cleared'
          : 'retry is blocked until the queue item is corrected',
      blockingReasons: missing
    };
  }
  if (status === PAYOUT_STATES.PENDING) {
    return {
      eligible: true,
      reason: live ? 'eligible for the next worker run' : 'eligible for the next worker run (dry-run: no XMR is sent)',
      blockingReasons: missing
    };
  }
  return { eligible: false, reason: `unrecognised settlement status: ${status}`, blockingReasons: missing };
}

function parseDate(value) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

/** Applies the issue's required filters: free text, status, program, account, date window. */
function applyFilters(items, filter = {}) {
  const q = typeof filter.q === 'string' ? filter.q.trim().toLowerCase() : '';
  const from = parseDate(filter.from);
  const to = parseDate(filter.to);
  const status = filter.status ? String(filter.status) : null;
  const program = filter.program ? String(filter.program) : null;
  const account = filter.account ? String(filter.account) : null;

  return items.filter((item) => {
    if (status && item.status !== status) return false;
    if (program && item.program !== program) return false;
    if (account && item.accountId !== account) return false;
    if (from !== null && parseDate(item.timestamp) !== null && parseDate(item.timestamp) < from) return false;
    if (to !== null && parseDate(item.timestamp) !== null && parseDate(item.timestamp) > to) return false;
    if (q && !item.searchText.includes(q)) return false;
    return true;
  });
}

function flattenLedgerEntries(ledger) {
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  const reversed = reversedEntryIds(entries);
  return entries.map((entry) => {
    const reference = entry?.reference || {};
    const searchText = [
      entry?.entry_id,
      entry?.account_id,
      entry?.entry_type,
      entry?.status,
      entry?.note,
      reference.bounty_id,
      reference.program,
      reference.repository,
      ...(Array.isArray(entry?.evidence) ? entry.evidence : [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return {
      kind: 'MYZ_LEDGER_ENTRY',
      entryId: entry?.entry_id ?? null,
      timestamp: entry?.timestamp ?? null,
      accountId: entry?.account_id ?? null,
      amount: Number.isFinite(Number(entry?.amount_myz)) ? Number(entry.amount_myz) : null,
      asset: 'MYZ',
      entryType: entry?.entry_type ?? null,
      status: entry?.status ?? null,
      program: reference.program ?? null,
      bountyId: reference.bounty_id ?? null,
      issue: reference.issue ?? null,
      pullRequest: reference.pull_request ?? null,
      repository: reference.repository ?? null,
      reversesEntryId: entry?.reverses_entry_id ?? null,
      neutralized: reversed.has(entry?.entry_id),
      evidence: Array.isArray(entry?.evidence) ? entry.evidence : [],
      audit: { source: DEFAULT_PATHS.ledger, reference: entry?.entry_id ?? null },
      searchText
    };
  });
}

function flattenSettlementQueue(queue, { live = false } = {}) {
  const items = Array.isArray(queue?.items) ? queue.items : [];
  return items.map((item, index) => ({
    kind: 'XMR_PAYOUT',
    index,
    entryId: item?.myz_entry_id ?? null,
    bountyId: item?.bounty_id ?? null,
    accountId: item?.account_id ?? null,
    timestamp: item?.created_at ?? item?.last_check ?? null,
    amountAtomic: Number.isInteger(item?.amount_atomic) ? item.amount_atomic : null,
    amountXmr:
      Number.isInteger(item?.amount_atomic) ? round(item.amount_atomic / 1e12) : null,
    asset: 'XMR',
    status: item?.status ?? null,
    bountyApproved: item?.bounty_approved === true,
    xmrAddress: item?.xmr_address ?? null,
    txHash: item?.tx_hash ?? null,
    paidAt: item?.paid_at ?? null,
    lastCheck: item?.last_check ?? null,
    error: item?.error ?? null,
    idempotencyKey: item?.idempotency_key ?? null,
    retry: payoutRetry(item, { live }),
    evidence: Array.isArray(item?.evidence) ? item.evidence : [],
    audit: { source: DEFAULT_PATHS.queue, reference: item?.myz_entry_id ?? null },
    searchText: [
      item?.myz_entry_id,
      item?.bounty_id,
      item?.account_id,
      item?.status,
      item?.tx_hash,
      item?.error
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }));
}

function countBy(items, key = 'status') {
  return items.reduce((acc, item) => {
    const value = item?.[key];
    if (value === null || value === undefined) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Builds the dashboard payload.
 *
 * @param {object} options
 * @param {string} [options.baseDir]      repo root override (tests)
 * @param {object} [options.paths]        canonical file overrides (tests)
 * @param {object} [options.filter]       { q, status, program, account, from, to }
 * @param {string|null} [options.accountId] scope MYZ balances to one contributor
 * @param {Function} [options.fundingInputsProvider] real BTC/Stripe adapter boundary
 * @param {Function} [options.conversionProvider]    real conversion adapter boundary
 */
function buildDashboard(options = {}) {
  const {
    baseDir = REPO_ROOT,
    paths = {},
    filter = {},
    accountId = null,
    fundingInputsProvider = () => UNCONFIGURED,
    conversionProvider = () => UNCONFIGURED_CONVERSION,
    escrowProvider = () => UNCONFIGURED_ESCROW,
    live = process.env.MYZ_XMR_LIVE === 'true',
    now = new Date()
  } = options;

  const resolved = { ...DEFAULT_PATHS, ...paths };
  const warnings = [];

  const ledgerResult = readSource(resolved.ledger, { baseDir });
  const queueResult = readSource(resolved.queue, { baseDir });
  const policyResult = readSource(resolved.policy, { baseDir });

  const sources = [ledgerResult.descriptor, queueResult.descriptor, policyResult.descriptor];
  for (const source of sources) {
    if (!source.ok) {
      warnings.push(`${source.name} could not be read (${source.error}); its layer is reported as unknown, not zero.`);
    }
  }

  const ledger = ledgerResult.value;
  const queue = queueResult.value;
  const policy = policyResult.value;

  // Layer 1 + 2: incoming funding and its confirmation/settlement state.
  let fundingInputs;
  try {
    fundingInputs = normalizeFundingInputs(fundingInputsProvider());
  } catch (error) {
    warnings.push(`funding-input provider failed: ${error.message}`);
    fundingInputs = { ...UNCONFIGURED, reason: `funding-input provider failed: ${error.message}` };
  }

  // Layer 3: available balance derived only from settled funding.
  const availableBalance = computeAvailableBalance(fundingInputs);

  // Layer 4: conversion is a separate backend integration.
  let conversion;
  try {
    conversion = conversionProvider();
  } catch (error) {
    warnings.push(`conversion provider failed: ${error.message}`);
    conversion = { ...UNCONFIGURED_CONVERSION, reason: `conversion provider failed: ${error.message}` };
  }

  // Escrow is a distinct concern from payout status and has no canonical source here.
  let escrow;
  try {
    escrow = escrowProvider();
  } catch (error) {
    warnings.push(`escrow provider failed: ${error.message}`);
    escrow = { ...UNCONFIGURED_ESCROW, reason: `escrow provider failed: ${error.message}` };
  }

  // Layer 5 + 6: MYZ reward accounting and XMR payout settlement.
  const ledgerItems = ledger ? flattenLedgerEntries(ledger) : [];
  const payoutItems = queue ? flattenSettlementQueue(queue, { live }) : [];

  const filteredLedger = applyFilters(ledgerItems, filter);
  const filteredPayouts = applyFilters(payoutItems, filter);
  const filteredFunding = applyFilters(
    (fundingInputs.items || []).map((item) => ({
      ...item,
      searchText: [item.reference, item.asset, item.status, item.txId].filter(Boolean).join(' ').toLowerCase()
    })),
    filter
  );

  const myzTotal = ledger ? myzBalance(ledger, accountId) : null;

  return {
    generatedAt: now.toISOString(),
    live: live === true,
    scope: { accountId, filter },
    sources,
    warnings,
    policy: {
      rewardAsset: policy?.reward_asset ?? null,
      rewardLayer: policy?.reward_layer ?? null,
      fundingInputs: Array.isArray(policy?.funding_inputs) ? policy.funding_inputs : null,
      externalSettlementAsset: policy?.external_settlement_asset ?? null,
      states: Array.isArray(policy?.states) ? policy.states : null,
      rules: policy?.rules ?? null
    },
    layers: {
      funding_inputs: {
        configured: fundingInputs.configured === true,
        reason: fundingInputs.reason ?? null,
        totals: fundingInputs.totals,
        counts: countBy(filteredFunding),
        items: filteredFunding
      },
      available_balance: availableBalance,
      conversion: {
        configured: conversion?.configured === true,
        reason: conversion?.reason ?? null,
        counts: countBy(conversion?.items || []),
        items: conversion?.items || []
      },
      escrow: {
        configured: escrow?.configured === true,
        reason: escrow?.reason ?? null,
        counts: countBy(escrow?.items || []),
        items: escrow?.items || []
      },
      bounty_rewards: {
        counts: countBy(filteredLedger, 'status'),
        totalsByProgram: totalsByProgram(filteredLedger),
        items: filteredLedger
      },
      xmr_payouts: {
        counts: countBy(filteredPayouts, 'status'),
        items: filteredPayouts
      }
    },
    balances: {
      myz: {
        amount: myzTotal,
        asset: ledger?.asset ?? 'MYZ',
        assetType: ledger?.asset_type ?? 'internal-reward-accounting-unit',
        onChain: ledger?.on_chain === true,
        basis: 'sum of RECORDED ledger entries not neutralized by a valid reversal',
        source: ledger ? resolved.ledger : null
      },
      xmr: {
        amount: null,
        asset: 'XMR',
        reason:
          'The treasury XMR balance lives in the Monero wallet RPC, not in this repository. It is reported as unknown rather than zero because no wallet RPC is configured.',
        source: null
      }
    },
    integrity: {
      ledgerSha256: ledger?.integrity?.sha256 ?? null,
      signature: ledger?.integrity?.signature ?? null,
      published: Boolean(ledger?.integrity?.sha256 || ledger?.integrity?.signature)
    }
  };
}

function normalizeFundingInputs(input) {
  if (!input || typeof input !== 'object') return { ...UNCONFIGURED };
  const items = Array.isArray(input.items) ? input.items : [];
  const totals =
    input.totals && typeof input.totals === 'object'
      ? input.totals
      : { incoming: null, confirmed: null, settled: null };
  return {
    configured: input.configured === true,
    reason: input.reason ?? null,
    items: items.map((item, index) => ({
      kind: 'FUNDING_INPUT',
      index,
      asset: item?.asset ?? null,
      rail: item?.rail ?? null,
      status: item?.status ?? null,
      amount: Number.isFinite(Number(item?.amount)) ? Number(item.amount) : null,
      currency: item?.currency ?? null,
      confirmations: Number.isFinite(Number(item?.confirmations)) ? Number(item.confirmations) : null,
      timestamp: item?.timestamp ?? null,
      txId: item?.txId ?? null,
      reference: item?.reference ?? null,
      bountyId: item?.bounty_id ?? null,
      approvesBounty: false,
      audit: { source: item?.source ?? null, reference: item?.reference ?? item?.txId ?? null }
    })),
    totals
  };
}

/**
 * Available balance counts only settled funding inputs. When no funding-input
 * repository is configured the balance is unknown (null), never zero.
 */
function computeAvailableBalance(fundingInputs) {
  if (fundingInputs?.configured !== true) {
    return {
      amount: null,
      currency: null,
      basis: 'settled BTC receipts and Stripe settlements only',
      reason: fundingInputs?.reason ?? 'funding inputs are not configured',
      countsSettledInputs: 0
    };
  }
  const settled = (fundingInputs.items || []).filter((item) => SETTLED_FUNDING_STATES.includes(item.status));
  const currencies = new Set(settled.map((item) => item.currency).filter(Boolean));
  if (currencies.size > 1) {
    return {
      amount: null,
      currency: null,
      basis: 'settled BTC receipts and Stripe settlements only',
      reason: `settled funding inputs span multiple currencies (${[...currencies].join(', ')}); a single available balance requires conversion to a common unit`,
      countsSettledInputs: settled.length
    };
  }
  const currency = currencies.size === 1 ? [...currencies][0] : null;
  const total = settled.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return {
    amount: settled.length === 0 ? 0 : round(total),
    currency,
    basis: 'settled BTC receipts and Stripe settlements only',
    reason: null,
    countsSettledInputs: settled.length
  };
}

function totalsByProgram(items) {
  return items.reduce((acc, item) => {
    if (item?.status !== 'RECORDED' || item?.neutralized) return acc;
    if (item?.entryType === 'REVERSAL') return acc;
    const key = item?.program ?? 'unspecified';
    acc[key] = round((acc[key] || 0) + (Number(item.amount) || 0));
    return acc;
  }, {});
}

module.exports = {
  CONVERSION_STATES,
  DEFAULT_PATHS,
  FUNDING_STATES,
  PAYOUT_STATES,
  REPO_ROOT,
  UNCONFIGURED,
  UNCONFIGURED_CONVERSION,
  UNCONFIGURED_ESCROW,
  applyFilters,
  buildDashboard,
  computeAvailableBalance,
  flattenLedgerEntries,
  flattenSettlementQueue,
  myzBalance,
  payoutRetry,
  readSource,
  reversedEntryIds
};
