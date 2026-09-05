'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { getPaymentIntent, PLANS } = require('../src/services/zorgaxMonetizationService');

describe('Zorgax payment intent expiry', () => {
  test('marks an expired pending intent as EXPIRED when read', async () => {
    const intent = {
      _id: 'mongo-id', intentId: 'zorgax_expired', ownerId: 'owner-1', plan: 'pro', asset: 'BTC', destination: 'bc1qdest',
      quote: { denomination: 'EUR', amount: PLANS.pro.priceEur, cryptoAmount: '0.0001', eurPerCoin: 99000, observedAt: new Date(), source: 'test', status: 'QUOTED' },
      settlement: { status: 'PENDING' }, expiresAt: new Date(Date.now() - 1000)
    };
    ZorgaxPaymentIntent.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(intent) });
    ZorgaxPaymentIntent.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const result = await getPaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_expired' });
    expect(result.settlementStatus).toBe('EXPIRED');
    expect(ZorgaxPaymentIntent.updateOne).toHaveBeenCalled();
  });
});
