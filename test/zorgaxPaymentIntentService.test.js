'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/services/zorgaxChainVerifierService');
jest.mock('../src/services/zorgaxSubscriptionService');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { verifySettlement } = require('../src/services/zorgaxChainVerifierService');
const { recordVerifiedPayment } = require('../src/services/zorgaxSubscriptionService');
const { verifyAndActivatePaymentIntent } = require('../src/services/zorgaxPaymentIntentService');

describe('Zorgax persisted payment intent activation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses immutable server-side intent values for verification and activation', async () => {
    const intent = {
      intentId: 'zorgax_test', ownerId: 'owner-1', plan: 'pro', asset: 'BTC',
      destination: 'bc1qserverdestination', quote: { cryptoAmount: '0.00007212' },
      settlement: { status: 'PENDING' }, expiresAt: new Date(Date.now() + 60000), consumedAt: null,
      save: jest.fn().mockResolvedValue(undefined)
    };
    ZorgaxPaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: 'a'.repeat(64), verifier: 'btc-test', confirmations: 1, amount: 0.00007212 });
    recordVerifiedPayment.mockResolvedValue({ _id: 'sub-1', plan: 'pro', access: { status: 'ACTIVE' } });

    const result = await verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'a'.repeat(64) });

    expect(verifySettlement).toHaveBeenCalledWith(expect.objectContaining({ asset: 'BTC', destination: 'bc1qserverdestination', cryptoAmount: '0.00007212' }));
    expect(recordVerifiedPayment).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', planId: 'pro', asset: 'BTC' }));
    expect(intent.settlement.status).toBe('VERIFIED');
    expect(intent.consumedAt).toBeInstanceOf(Date);
    expect(result.access.status).toBe('ACTIVE');
  });

  test('expires stale intents before calling a verifier', async () => {
    const intent = {
      ownerId: 'owner-1', settlement: { status: 'PENDING' }, expiresAt: new Date(Date.now() - 1000), consumedAt: null,
      save: jest.fn().mockResolvedValue(undefined)
    };
    ZorgaxPaymentIntent.findOne.mockResolvedValue(intent);

    await expect(verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'expired', paymentReference: 'b'.repeat(64) })).rejects.toThrow('Payment intent scaduto');
    expect(verifySettlement).not.toHaveBeenCalled();
    expect(intent.settlement.status).toBe('EXPIRED');
  });

  test('rejects already consumed intents', async () => {
    ZorgaxPaymentIntent.findOne.mockResolvedValue({ settlement: { status: 'VERIFIED' }, consumedAt: new Date(), expiresAt: new Date(Date.now() + 60000) });
    await expect(verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'used', paymentReference: 'c'.repeat(64) })).rejects.toThrow('Payment intent già utilizzato');
    expect(verifySettlement).not.toHaveBeenCalled();
  });
});
