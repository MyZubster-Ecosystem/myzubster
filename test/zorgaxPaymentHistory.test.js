'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/models/ZorgaxSubscription');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { listPaymentIntents } = require('../src/services/zorgaxLegacyMonetizationService');

describe('Zorgax payment history', () => {
  test('returns only owner-scoped public payment details and tracking state', async () => {
    const limit = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{
      intentId: 'zorgax_history', plan: 'pro', asset: 'BTC', destination: 'bc1qdest', renewalOf: null,
      quote: { denomination: 'EUR', amount: 9.9, cryptoAmount: '0.00014728', eurPerCoin: 67219, observedAt: new Date(), source: 'test', status: 'QUOTED' },
      settlement: { status: 'PENDING', paymentReference: 'e'.repeat(64), submittedAt: new Date(), checkAttempts: 2, lastError: 'Conferme blockchain insufficienti' },
      expiresAt: new Date()
    }]) });
    const sort = jest.fn().mockReturnValue({ limit });
    ZorgaxPaymentIntent.updateMany.mockResolvedValue({ modifiedCount: 0 });
    ZorgaxPaymentIntent.find.mockReturnValue({ sort });

    const history = await listPaymentIntents({ ownerId: 'owner-1', limit: 10 });

    expect(ZorgaxPaymentIntent.find).toHaveBeenCalledWith({ ownerId: 'owner-1' });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ intentId: 'zorgax_history', settlementStatus: 'PENDING', tracking: { automatic: true, checkAttempts: 2 } });
    expect(history[0].ownerId).toBeUndefined();
  });
});
