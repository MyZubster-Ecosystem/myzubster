'use strict';

/**
 * settlementDashboardService — myzubster#306
 *
 * The issue requires that the dashboard never reports a state that did not
 * happen. These tests pin that behaviour: unknown is null, never zero, and
 * every figure is traceable to a canonical source.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const service = require('../src/services/settlementDashboardService');

let tmpDir;

function writeFixture(name, value) {
  const target = path.join(tmpDir, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  return target;
}

function ledgerFixture(entries) {
  return {
    schema: 'myzubster-myz-ledger/v1',
    asset: 'MYZ',
    asset_type: 'internal-reward-accounting-unit',
    on_chain: false,
    entries,
    integrity: { canonicalization: 'json-key-sort-v1', sha256: null, signature: null }
  };
}

function entry(overrides = {}) {
  return {
    timestamp: '2026-08-23T02:37:00Z',
    account_id: 'contributor:github:alice',
    amount_myz: 100,
    entry_type: 'BOUNTY_REWARD',
    reference: { program: 'github-bounty', bounty_id: 'MYZ-306', issue: 306 },
    status: 'RECORDED',
    evidence: ['https://example.test/pr/1'],
    reverses_entry_id: null,
    note: 'fixture',
    ...overrides
  };
}

function setupFixtures({ entries = [], queueItems = [], policy = null } = {}) {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myz-dash-'));
  fs.mkdirSync(path.join(tmpDir, 'myz'), { recursive: true });
  writeFixture('myz/ledger.json', ledgerFixture(entries));
  writeFixture('myz/settlement-queue.json', { schema: 'myzubster-xmr-settlement/v1', items: queueItems });
  if (policy) writeFixture('myz/settlement-policy.json', policy);
  return { baseDir: tmpDir, paths: { ledger: 'myz/ledger.json', queue: 'myz/settlement-queue.json', policy: 'myz/settlement-policy.json' } };
}

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

describe('MYZ balance', () => {
  test('sums RECORDED entries', () => {
    const opts = setupFixtures({ entries: [entry({ entry_id: 'A' }), entry({ entry_id: 'B', amount_myz: 50 })] });
    expect(service.buildDashboard(opts).balances.myz.amount).toBe(150);
  });

  test('excludes entries that are not RECORDED', () => {
    const opts = setupFixtures({
      entries: [
        entry({ entry_id: 'A', amount_myz: 100 }),
        entry({ entry_id: 'B', amount_myz: 999, status: 'PROPOSED' }),
        entry({ entry_id: 'C', amount_myz: 999, status: 'APPROVED' })
      ]
    });
    expect(service.buildDashboard(opts).balances.myz.amount).toBe(100);
  });

  test('excludes entries neutralized by a RECORDED reversal', () => {
    const opts = setupFixtures({
      entries: [
        entry({ entry_id: 'A', amount_myz: 100 }),
        entry({ entry_id: 'R', amount_myz: -100, entry_type: 'REVERSAL', reverses_entry_id: 'A', status: 'RECORDED' })
      ]
    });
    const data = service.buildDashboard(opts);
    expect(data.balances.myz.amount).toBe(0);
    expect(data.layers.bounty_rewards.items.find((i) => i.entryId === 'A').neutralized).toBe(true);
  });

  test('does not apply a reversal that is not yet RECORDED', () => {
    const opts = setupFixtures({
      entries: [
        entry({ entry_id: 'A', amount_myz: 100 }),
        entry({ entry_id: 'R', amount_myz: -100, entry_type: 'REVERSAL', reverses_entry_id: 'A', status: 'PROPOSED' })
      ]
    });
    expect(service.buildDashboard(opts).balances.myz.amount).toBe(100);
  });

  test('a reversal is a marker, not an additional debit', () => {
    const opts = setupFixtures({
      entries: [
        entry({ entry_id: 'A', amount_myz: 100 }),
        entry({ entry_id: 'B', amount_myz: 40 }),
        entry({ entry_id: 'R', amount_myz: -40, entry_type: 'REVERSAL', reverses_entry_id: 'B', status: 'RECORDED' }),
        entry({ entry_id: 'D', amount_myz: -30, entry_type: 'ADJUSTMENT_DEBIT' })
      ]
    });
    const data = service.buildDashboard(opts);
    expect(data.balances.myz.amount).toBe(70);
    expect(data.layers.bounty_rewards.items.find((i) => i.entryId === 'B').neutralized).toBe(true);
  });

  test('scopes the balance to one account when requested', () => {
    const opts = setupFixtures({
      entries: [
        entry({ entry_id: 'A', account_id: 'contributor:github:alice', amount_myz: 100 }),
        entry({ entry_id: 'B', account_id: 'contributor:github:bob', amount_myz: 70 })
      ]
    });
    const data = service.buildDashboard({ ...opts, accountId: 'contributor:github:bob' });
    expect(data.balances.myz.amount).toBe(70);
  });
});

describe('XMR balance is never fabricated', () => {
  test('is null even when the settlement queue has paid items', () => {
    const opts = setupFixtures({
      entries: [entry({ entry_id: 'A' })],
      queueItems: [
        {
          myz_entry_id: 'A',
          bounty_id: 'MYZ-306',
          bounty_approved: true,
          xmr_address: '4Adummy',
          amount_atomic: 1e12,
          status: 'XMR_PAID',
          tx_hash: 'deadbeef',
          evidence: ['https://example.test/pr/1']
        }
      ]
    });
    const data = service.buildDashboard(opts);
    expect(data.balances.xmr.amount).toBeNull();
    expect(data.balances.xmr.reason).toMatch(/unknown rather than zero/i);
  });
});

describe('available balance', () => {
  const settledBtc = {
    configured: true,
    items: [
      { asset: 'BTC', rail: 'bitcoin', status: 'SETTLED', amount: 0.5, currency: 'BTC', reference: 'tx-1' },
      { asset: 'BTC', rail: 'bitcoin', status: 'INCOMING', amount: 2, currency: 'BTC', reference: 'tx-2' },
      { asset: 'BTC', rail: 'bitcoin', status: 'FAILED', amount: 9, currency: 'BTC', reference: 'tx-3' }
    ]
  };

  test('is null when no funding-input repository is configured', () => {
    const opts = setupFixtures({ entries: [] });
    const data = service.buildDashboard(opts);
    expect(data.layers.available_balance.amount).toBeNull();
    expect(data.layers.funding_inputs.configured).toBe(false);
  });

  test('counts only settled inputs', () => {
    const opts = setupFixtures({ entries: [] });
    const data = service.buildDashboard({ ...opts, fundingInputsProvider: () => settledBtc });
    expect(data.layers.available_balance.amount).toBe(0.5);
    expect(data.layers.available_balance.countsSettledInputs).toBe(1);
  });

  test('is null when settled inputs span multiple currencies', () => {
    const mixed = {
      configured: true,
      items: [
        { asset: 'BTC', status: 'SETTLED', amount: 0.5, currency: 'BTC' },
        { asset: 'STRIPE', status: 'SETTLED', amount: 120, currency: 'EUR' }
      ]
    };
    const opts = setupFixtures({ entries: [] });
    const data = service.buildDashboard({ ...opts, fundingInputsProvider: () => mixed });
    expect(data.layers.available_balance.amount).toBeNull();
    expect(data.layers.available_balance.reason).toMatch(/multiple currencies/i);
  });

  test('never marks a funding input as approving a bounty', () => {
    const opts = setupFixtures({ entries: [] });
    const data = service.buildDashboard({ ...opts, fundingInputsProvider: () => settledBtc });
    data.layers.funding_inputs.items.forEach((item) => {
      expect(item.approvesBounty).toBe(false);
    });
  });

  test('survives a provider that throws', () => {
    const opts = setupFixtures({ entries: [] });
    const data = service.buildDashboard({
      ...opts,
      fundingInputsProvider: () => {
        throw new Error('adapter offline');
      }
    });
    expect(data.layers.available_balance.amount).toBeNull();
    expect(data.warnings.join(' ')).toMatch(/adapter offline/);
  });
});

describe('XMR payout layer', () => {
  test('surfaces idempotency keys', () => {
    const opts = setupFixtures({
      entries: [entry({ entry_id: 'A' })],
      queueItems: [{ myz_entry_id: 'A', status: 'SETTLEMENT_PENDING', idempotency_key: 'abc123' }]
    });
    const data = service.buildDashboard(opts);
    expect(data.layers.xmr_payouts.items[0].idempotencyKey).toBe('abc123');
  });

  test('a paid settlement is terminal and not retryable', () => {
    const opts = setupFixtures({
      entries: [entry({ entry_id: 'A' })],
      queueItems: [{ myz_entry_id: 'A', status: 'XMR_PAID' }]
    });
    const retry = service.buildDashboard(opts).layers.xmr_payouts.items[0].retry;
    expect(retry.eligible).toBe(false);
    expect(retry.reason).toMatch(/terminal/i);
  });

  test('an in-flight payout refuses resubmission', () => {
    const opts = setupFixtures({
      entries: [entry({ entry_id: 'A' })],
      queueItems: [{ myz_entry_id: 'A', status: 'XMR_PAYOUT_PENDING' }]
    });
    const retry = service.buildDashboard(opts).layers.xmr_payouts.items[0].retry;
    expect(retry.eligible).toBe(false);
    expect(retry.reason).toMatch(/idempotency key/i);
  });

  test('a failed payout is retryable only once its blockers are cleared', () => {
    const opts = setupFixtures({
      entries: [entry({ entry_id: 'A' })],
      queueItems: [
        { myz_entry_id: 'A', status: 'SETTLEMENT_FAILED', xmr_address: '4Ax' },
        {
          myz_entry_id: 'B',
          status: 'SETTLEMENT_FAILED',
          bounty_approved: true,
          xmr_address: '4Ax',
          amount_atomic: 1e12,
          evidence: ['https://example.test/pr/1']
        }
      ]
    });
    const items = service.buildDashboard(opts).layers.xmr_payouts.items;
    expect(items[0].retry.eligible).toBe(false);
    expect(items[0].retry.blockingReasons.length).toBeGreaterThan(0);
    expect(items[1].retry.eligible).toBe(true);
    expect(items[1].retry.blockingReasons).toEqual([]);
  });
});

describe('filters and search', () => {
  const entries = [
    entry({ entry_id: 'A', reference: { program: 'github-bounty', bounty_id: 'MYZ-306' }, timestamp: '2026-01-01T00:00:00Z' }),
    entry({ entry_id: 'B', reference: { program: 'identity', bounty_id: 'ID-2' }, timestamp: '2026-06-01T00:00:00Z', status: 'PROPOSED' })
  ];

  test('free text matches bounty id', () => {
    const opts = setupFixtures({ entries });
    const data = service.buildDashboard({ ...opts, filter: { q: 'MYZ-306' } });
    expect(data.layers.bounty_rewards.items.map((i) => i.entryId)).toEqual(['A']);
  });

  test('status filter narrows results', () => {
    const opts = setupFixtures({ entries });
    const data = service.buildDashboard({ ...opts, filter: { status: 'PROPOSED' } });
    expect(data.layers.bounty_rewards.items.map((i) => i.entryId)).toEqual(['B']);
  });

  test('program filter narrows results', () => {
    const opts = setupFixtures({ entries });
    const data = service.buildDashboard({ ...opts, filter: { program: 'identity' } });
    expect(data.layers.bounty_rewards.items.map((i) => i.entryId)).toEqual(['B']);
  });

  test('date window narrows results', () => {
    const opts = setupFixtures({ entries });
    const data = service.buildDashboard({ ...opts, filter: { from: '2026-03-01', to: '2026-12-31' } });
    expect(data.layers.bounty_rewards.items.map((i) => i.entryId)).toEqual(['B']);
  });

  test('an empty result set is empty, not populated with samples', () => {
    const opts = setupFixtures({ entries });
    const data = service.buildDashboard({ ...opts, filter: { q: 'does-not-exist' } });
    expect(data.layers.bounty_rewards.items).toEqual([]);
  });
});

describe('unreadable sources', () => {
  test('report a warning and an unknown balance instead of zero', () => {
    const opts = setupFixtures({ entries: [entry({ entry_id: 'A' })] });
    fs.rmSync(path.join(tmpDir, 'myz', 'ledger.json'));
    const data = service.buildDashboard(opts);
    expect(data.balances.myz.amount).toBeNull();
    expect(data.warnings.join(' ')).toMatch(/could not be read/);
    expect(data.sources.find((s) => s.name === 'myz/ledger.json').ok).toBe(false);
  });
});

describe('repo defaults', () => {
  test('reads the committed canonical files without throwing', () => {
    const data = service.buildDashboard();
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.sources.every((s) => s.ok)).toBe(true);
    expect(data.balances.xmr.amount).toBeNull();
  });
});
