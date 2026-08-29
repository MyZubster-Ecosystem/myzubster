'use strict';

const {
  ECONOMIC_ENTRY_TYPES
} = require('../src/models/ZorgaxEconomicLedgerEntry');
const {
  applyEntry,
  getTreasurySnapshot
} = require('../src/services/zorgaxTreasuryService');

function createFindModel(rows, captured = {}) {
  return {
    find(filter) {
      captured.filter = filter;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        async lean() {
          return rows;
        }
      };
    }
  };
}

describe('Zorgax Treasury Service', () => {
  test('calculates revenue, expenses, liabilities, reserve and investable capital', async () => {
    const rows = [
      { type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED, amountMinor: 100000 },
      { type: ECONOMIC_ENTRY_TYPES.EXPENSE_RECOGNIZED, amountMinor: 20000 },
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED, amountMinor: 15000 }
    ];

    const snapshot = await getTreasurySnapshot({
      LedgerModel: createFindModel(rows),
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      reserveMinor: 30000,
      asOf: new Date('2026-08-29T12:00:00Z')
    });

    expect(snapshot.recognizedRevenueMinor).toBe(100000);
    expect(snapshot.recognizedExpensesMinor).toBe(20000);
    expect(snapshot.recognizedProfitMinor).toBe(80000);
    expect(snapshot.outstandingLiabilitiesMinor).toBe(15000);
    expect(snapshot.treasuryBalanceMinor).toBe(80000);
    expect(snapshot.capitalBeforeReserveMinor).toBe(65000);
    expect(snapshot.investableCapitalMinor).toBe(35000);
    expect(snapshot.accountingBasis).toBe('zorgax_economic_ledger_v1');
  });

  test('keeps asset and network isolated in the ledger query', async () => {
    const captured = {};
    await getTreasurySnapshot({
      LedgerModel: createFindModel([], captured),
      ownerId: 'myzubster-ecosystem',
      asset: 'btc',
      network: 'testnet',
      reserveMinor: 0,
      asOf: new Date('2026-08-29T12:00:00Z')
    });

    expect(captured.filter.ownerId).toBe('myzubster-ecosystem');
    expect(captured.filter.asset).toBe('BTC');
    expect(captured.filter.network).toBe('testnet');
    expect(captured.filter.occurredAt.$lte).toEqual(new Date('2026-08-29T12:00:00Z'));
  });

  test('never exposes negative investable capital', async () => {
    const rows = [
      { type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED, amountMinor: 10000 },
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED, amountMinor: 9000 }
    ];

    const snapshot = await getTreasurySnapshot({
      LedgerModel: createFindModel(rows),
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      reserveMinor: 5000
    });

    expect(snapshot.capitalBeforeReserveMinor).toBe(1000);
    expect(snapshot.investableCapitalMinor).toBe(0);
  });

  test('liability settlement reduces both outstanding liability and treasury cash', async () => {
    const rows = [
      { type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED, amountMinor: 50000 },
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED, amountMinor: 10000 },
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED, amountMinor: 4000 }
    ];

    const snapshot = await getTreasurySnapshot({
      LedgerModel: createFindModel(rows),
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      reserveMinor: 0
    });

    expect(snapshot.outstandingLiabilitiesMinor).toBe(6000);
    expect(snapshot.treasuryBalanceMinor).toBe(46000);
    expect(snapshot.investableCapitalMinor).toBe(40000);
  });

  test('rejects a ledger that settles more liability than was accrued', async () => {
    const rows = [
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_ACCRUED, amountMinor: 1000 },
      { type: ECONOMIC_ENTRY_TYPES.LIABILITY_SETTLED, amountMinor: 2000 }
    ];

    await expect(getTreasurySnapshot({
      LedgerModel: createFindModel(rows),
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC'
    })).rejects.toThrow(/negative outstanding liabilities/);
  });

  test('applies treasury-only adjustments without changing recognized profit', async () => {
    const totals = {
      recognizedRevenueMinor: 0,
      recognizedExpensesMinor: 0,
      outstandingLiabilitiesMinor: 0,
      treasuryBalanceMinor: 0
    };

    applyEntry(totals, { type: ECONOMIC_ENTRY_TYPES.TREASURY_INFLOW, amountMinor: 9000 });
    applyEntry(totals, { type: ECONOMIC_ENTRY_TYPES.TREASURY_OUTFLOW, amountMinor: 2000 });

    expect(totals.treasuryBalanceMinor).toBe(7000);
    expect(totals.recognizedRevenueMinor).toBe(0);
    expect(totals.recognizedExpensesMinor).toBe(0);
  });
});
