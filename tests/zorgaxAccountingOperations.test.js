'use strict';

const {
  accrueLiability,
  getLiabilityPosition,
  recordExpense,
  settleLiability
} = require('../src/services/zorgaxAccountingOperationsService');

function chain(rows) {
  return {
    select() { return this; },
    sort() { return this; },
    lean: jest.fn().mockResolvedValue(rows)
  };
}

function ledgerMock() {
  const rows = [];

  function matches(row, filter) {
    return Object.entries(filter).every(([key, value]) => {
      if (key === 'metadata.liabilityReference') {
        return row.metadata?.liabilityReference === value;
      }
      if (key === 'type' && value && Array.isArray(value.$in)) {
        return value.$in.includes(row.type);
      }
      return row[key] === value;
    });
  }

  return {
    rows,
    findOne: jest.fn(async (filter) => rows.find((row) => matches(row, filter)) || null),
    find: jest.fn((filter) => chain(rows.filter((row) => matches(row, filter)))),
    create: jest.fn(async (doc) => {
      const row = {
        entryId: `zel-${rows.length + 1}`,
        createdAt: new Date('2026-08-29T12:00:00.000Z'),
        updatedAt: new Date('2026-08-29T12:00:00.000Z'),
        ...doc
      };
      rows.push(row);
      return row;
    })
  };
}

describe('Zorgax Accounting Operations', () => {
  test('records expenses idempotently with ecosystem accounting metadata', async () => {
    const LedgerModel = ledgerMock();

    const first = await recordExpense({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'btc',
      network: 'mainnet',
      amountMinor: 12000,
      expenseReference: 'invoice-42',
      description: 'Infrastructure invoice',
      recordedBy: 'admin-1'
    });
    const replay = await recordExpense({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 12000,
      expenseReference: 'invoice-42',
      description: 'Infrastructure invoice',
      recordedBy: 'admin-1'
    });

    expect(first.type).toBe('EXPENSE_RECOGNIZED');
    expect(first.sourceReference).toBe('expense:invoice-42');
    expect(first.metadata.recordedBy).toBe('admin-1');
    expect(replay.entryId).toBe(first.entryId);
    expect(LedgerModel.rows).toHaveLength(1);
  });

  test('accrues and partially settles a liability', async () => {
    const LedgerModel = ledgerMock();

    await accrueLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 30000,
      liabilityReference: 'hosting-q3'
    });

    const result = await settleLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 10000,
      liabilityReference: 'hosting-q3',
      settlementReference: 'payment-1'
    });

    expect(result.replay).toBe(false);
    expect(result.entry.type).toBe('LIABILITY_SETTLED');
    expect(result.liability.accruedMinor).toBe(30000);
    expect(result.liability.settledMinor).toBe(10000);
    expect(result.liability.outstandingMinor).toBe(20000);
  });

  test('settlement replay is idempotent even after the liability reaches zero', async () => {
    const LedgerModel = ledgerMock();

    await accrueLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 5000,
      liabilityReference: 'audit-fee'
    });

    const first = await settleLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 5000,
      liabilityReference: 'audit-fee',
      settlementReference: 'tx-1'
    });
    const replay = await settleLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 5000,
      liabilityReference: 'audit-fee',
      settlementReference: 'tx-1'
    });

    expect(first.replay).toBe(false);
    expect(replay.replay).toBe(true);
    expect(replay.liability.outstandingMinor).toBe(0);
    expect(LedgerModel.rows).toHaveLength(2);
  });

  test('rejects settlements above the outstanding liability', async () => {
    const LedgerModel = ledgerMock();

    await accrueLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 7000,
      liabilityReference: 'legal-1'
    });

    await expect(settleLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 7001,
      liabilityReference: 'legal-1',
      settlementReference: 'payment-1'
    })).rejects.toThrow(/exceeds outstanding/);
  });

  test('keeps liability positions isolated by asset and network', async () => {
    const LedgerModel = ledgerMock();

    await accrueLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 9000,
      liabilityReference: 'shared-ref'
    });
    await accrueLiability({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'testnet',
      amountMinor: 2000,
      liabilityReference: 'shared-ref'
    });

    const mainnet = await getLiabilityPosition({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      liabilityReference: 'shared-ref'
    });
    const testnet = await getLiabilityPosition({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'testnet',
      liabilityReference: 'shared-ref'
    });

    expect(mainnet.outstandingMinor).toBe(9000);
    expect(testnet.outstandingMinor).toBe(2000);
  });
});
