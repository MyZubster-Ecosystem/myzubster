'use strict';

const {
  recognizeConfirmedPaymentIntentDocument,
  syncConfirmedPaymentIntents
} = require('../src/services/zorgaxAccountingIngestionService');

function chainResult(rows) {
  return {
    select() { return this; },
    sort() { return this; },
    lean: jest.fn().mockResolvedValue(rows)
  };
}

function ledgerMock() {
  const rows = [];
  return {
    rows,
    findOne: jest.fn(async (filter) => rows.find((row) =>
      row.ownerId === filter.ownerId &&
      row.asset === filter.asset &&
      row.network === filter.network &&
      row.sourceType === filter.sourceType &&
      row.sourceReference === filter.sourceReference
    ) || null),
    create: jest.fn(async (doc) => {
      const row = { entryId: `entry-${rows.length + 1}`, ...doc };
      rows.push(row);
      return row;
    })
  };
}

function confirmedIntent(overrides = {}) {
  return {
    intentId: 'pi-1',
    ownerId: 'user-1',
    purpose: 'zorgax:pro',
    asset: 'BTC',
    network: 'mainnet',
    amountMinor: 25000,
    paymentReference: 'ref-1',
    txId: 'a'.repeat(64),
    status: 'CONFIRMED',
    confirmedAt: new Date('2026-08-29T12:00:00.000Z'),
    ...overrides
  };
}

describe('Zorgax Accounting Ingestion', () => {
  test('recognizes a confirmed PaymentIntent once as ecosystem revenue', async () => {
    const LedgerModel = ledgerMock();
    const intent = confirmedIntent();

    const first = await recognizeConfirmedPaymentIntentDocument({ LedgerModel, intent });
    const replay = await recognizeConfirmedPaymentIntentDocument({ LedgerModel, intent });

    expect(first.type).toBe('REVENUE_RECOGNIZED');
    expect(first.ownerId).toBe('myzubster-ecosystem');
    expect(first.amountMinor).toBe(25000);
    expect(first.sourceType).toBe('PAYMENT_INTENT');
    expect(first.sourceReference).toBe('pi-1');
    expect(first.metadata.paymentIntentOwnerId).toBe('user-1');
    expect(replay.entryId).toBe(first.entryId);
    expect(LedgerModel.create).toHaveBeenCalledTimes(1);
  });

  test('rejects unconfirmed PaymentIntents', async () => {
    const LedgerModel = ledgerMock();
    await expect(recognizeConfirmedPaymentIntentDocument({
      LedgerModel,
      intent: confirmedIntent({ status: 'SUBMITTED', confirmedAt: null })
    })).rejects.toThrow(/must be CONFIRMED/);
  });

  test('sync keeps asset and network scoped and is idempotent', async () => {
    const LedgerModel = ledgerMock();
    const intents = [confirmedIntent(), confirmedIntent({ intentId: 'pi-2', amountMinor: 50000, paymentReference: 'ref-2', txId: 'b'.repeat(64) })];
    const PaymentIntentModel = {
      find: jest.fn(() => chainResult(intents))
    };

    const first = await syncConfirmedPaymentIntents({
      PaymentIntentModel,
      LedgerModel,
      asset: 'btc',
      network: 'mainnet',
      windowDays: 30,
      now: new Date('2026-08-29T13:00:00.000Z')
    });
    await syncConfirmedPaymentIntents({
      PaymentIntentModel,
      LedgerModel,
      asset: 'BTC',
      network: 'mainnet',
      windowDays: 30,
      now: new Date('2026-08-29T13:00:00.000Z')
    });

    expect(PaymentIntentModel.find).toHaveBeenCalledWith(expect.objectContaining({
      status: 'CONFIRMED',
      asset: 'BTC',
      network: 'mainnet'
    }));
    expect(first.recognizedEntryCount).toBe(2);
    expect(LedgerModel.rows).toHaveLength(2);
  });
});
