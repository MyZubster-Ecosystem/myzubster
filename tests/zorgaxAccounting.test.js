'use strict';

const {
  ECONOMIC_ENTRY_TYPES,
  ECONOMIC_SOURCE_TYPES
} = require('../src/models/ZorgaxEconomicLedgerEntry');
const {
  normalizeAsset,
  recordEconomicEntry,
  requireSafePositiveInteger
} = require('../src/services/zorgaxAccountingService');

function createLedgerModel() {
  const rows = [];
  return {
    rows,
    async findOne(filter) {
      return rows.find((row) => (
        row.ownerId === filter.ownerId &&
        row.asset === filter.asset &&
        row.network === filter.network &&
        row.sourceType === filter.sourceType &&
        row.sourceReference === filter.sourceReference
      )) || null;
    },
    async create(data) {
      const row = {
        entryId: `zel_${rows.length + 1}`,
        ...data,
        createdAt: new Date('2026-08-29T00:00:00Z'),
        updatedAt: new Date('2026-08-29T00:00:00Z')
      };
      rows.push(row);
      return row;
    }
  };
}

describe('Zorgax Accounting Service', () => {
  test('normalizes assets and rejects invalid monetary values', () => {
    expect(normalizeAsset('btc')).toBe('BTC');
    expect(() => normalizeAsset('bad asset')).toThrow(/asset/);
    expect(() => requireSafePositiveInteger(0, 'amountMinor')).toThrow(/positive safe integer/);
  });

  test('records a revenue entry with explicit source provenance', async () => {
    const LedgerModel = createLedgerModel();
    const entry = await recordEconomicEntry({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED,
      asset: 'btc',
      network: 'mainnet',
      amountMinor: 50000,
      sourceType: ECONOMIC_SOURCE_TYPES.PAYMENT_INTENT,
      sourceReference: 'pi_123',
      description: 'Recognized Zorgax revenue'
    });

    expect(entry.asset).toBe('BTC');
    expect(entry.network).toBe('mainnet');
    expect(entry.amountMinor).toBe(50000);
    expect(entry.sourceReference).toBe('pi_123');
    expect(LedgerModel.rows).toHaveLength(1);
  });

  test('replays the same source idempotently', async () => {
    const LedgerModel = createLedgerModel();
    const input = {
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      type: ECONOMIC_ENTRY_TYPES.EXPENSE_RECOGNIZED,
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 1000,
      sourceType: ECONOMIC_SOURCE_TYPES.INVOICE,
      sourceReference: 'invoice_1'
    };

    const first = await recordEconomicEntry(input);
    const second = await recordEconomicEntry(input);

    expect(second.entryId).toBe(first.entryId);
    expect(LedgerModel.rows).toHaveLength(1);
  });

  test('rejects a source replay with different accounting data', async () => {
    const LedgerModel = createLedgerModel();
    await recordEconomicEntry({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED,
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 1000,
      sourceType: ECONOMIC_SOURCE_TYPES.PAYMENT_INTENT,
      sourceReference: 'pi_replay'
    });

    await expect(recordEconomicEntry({
      LedgerModel,
      ownerId: 'myzubster-ecosystem',
      type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED,
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 2000,
      sourceType: ECONOMIC_SOURCE_TYPES.PAYMENT_INTENT,
      sourceReference: 'pi_replay'
    })).rejects.toThrow(/different accounting data/);
  });
});
