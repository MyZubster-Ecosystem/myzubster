'use strict';

const {
  getConfirmedInflowSnapshot,
  parseWindowDays
} = require('../src/services/zorgaxCapitalMetricsService');

describe('Zorgax Capital Metrics', () => {
  test('sums only records returned by the confirmed inflow query', async () => {
    const lean = jest.fn().mockResolvedValue([
      { intentId: 'a', amountMinor: 1200 },
      { intentId: 'b', amountMinor: 800 }
    ]);
    const select = jest.fn(() => ({ lean }));
    const find = jest.fn(() => ({ select }));
    const PaymentIntentModel = { find };
    const now = new Date('2026-08-29T12:00:00.000Z');

    const snapshot = await getConfirmedInflowSnapshot({
      PaymentIntentModel,
      asset: 'btc',
      network: 'mainnet',
      windowDays: 30,
      now
    });

    expect(snapshot.confirmedRevenueMinor).toBe(2000);
    expect(snapshot.confirmedIntentCount).toBe(2);
    expect(snapshot.asset).toBe('BTC');
    expect(snapshot.network).toBe('mainnet');
    expect(snapshot.accountingBasis).toBe('confirmed_payment_intents');
    expect(find).toHaveBeenCalledTimes(1);
    expect(find.mock.calls[0][0]).toMatchObject({
      status: 'CONFIRMED',
      asset: 'BTC',
      network: 'mainnet'
    });
  });

  test('rejects invalid time windows', () => {
    expect(() => parseWindowDays(0)).toThrow('windowDays');
    expect(() => parseWindowDays(367)).toThrow('windowDays');
    expect(parseWindowDays(undefined)).toBe(30);
  });

  test('rejects unsafe payment amounts', async () => {
    const PaymentIntentModel = {
      find: () => ({
        select: () => ({
          lean: async () => [{ amountMinor: Number.MAX_SAFE_INTEGER + 1 }]
        })
      })
    };

    await expect(getConfirmedInflowSnapshot({
      PaymentIntentModel,
      asset: 'BTC'
    })).rejects.toThrow('PaymentIntent.amountMinor');
  });
});
