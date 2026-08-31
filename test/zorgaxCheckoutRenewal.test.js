'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/models/ZorgaxSubscription');
jest.mock('../src/services/zorgaxQuoteService');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const ZorgaxSubscription = require('../src/models/ZorgaxSubscription');
const { quotePlan } = require('../src/services/zorgaxQuoteService');
const { createCheckoutIntent } = require('../src/services/zorgaxLegacyMonetizationService');

describe('Zorgax checkout renewal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    quotePlan.mockResolvedValue({
      cryptoAmount: '0.00014728',
      eurPerCoin: 67219,
      observedAt: new Date('2026-08-31T12:00:00Z'),
      source: 'quote-test'
    });
    ZorgaxPaymentIntent.create.mockImplementation(async (document) => ({ ...document }));
  });

  test('resolves the active owner subscription and persists its renewal id', async () => {
    const sort = jest.fn().mockResolvedValue({ _id: 'subscription-1', ownerId: 'owner-1', plan: 'pro' });
    ZorgaxSubscription.findOne.mockReturnValue({ sort });

    const intent = await createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', asset: 'BTC', renew: true });

    expect(ZorgaxSubscription.findOne).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', plan: 'pro' }));
    expect(ZorgaxPaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({ renewalOf: 'subscription-1' }));
    expect(intent.renewal).toBe(true);
  });

  test('does not trust or resolve a renewal subscription for a normal checkout', async () => {
    const intent = await createCheckoutIntent({ ownerId: 'owner-1', planId: 'developer', asset: 'BTC', renew: false });

    expect(ZorgaxSubscription.findOne).not.toHaveBeenCalled();
    expect(ZorgaxPaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({ renewalOf: null }));
    expect(intent.renewal).toBe(false);
  });
});
