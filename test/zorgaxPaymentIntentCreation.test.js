'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/services/zorgaxQuoteService', () => ({ quotePlan: jest.fn() }));

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { quotePlan } = require('../src/services/zorgaxQuoteService');
const { createCheckoutIntent } = require('../src/services/zorgaxMonetizationService');

describe('Zorgax payment intent creation', () => {
  const previousWallet = process.env.ZORGAX_WALLET_BTC;
  afterAll(() => { process.env.ZORGAX_WALLET_BTC = previousWallet; });

  test('persists quote, owner, destination and expiry server-side', async () => {
    process.env.ZORGAX_WALLET_BTC = 'bc1qserverdestination';
    quotePlan.mockResolvedValue({ cryptoAmount: '0.0001', eurPerCoin: 99000, observedAt: new Date().toISOString(), source: 'test-provider' });
    ZorgaxPaymentIntent.create.mockImplementation(async value => ({ ...value }));

    const intent = await createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', asset: 'BTC' });
    expect(ZorgaxPaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', plan: 'pro', asset: 'BTC', destination: 'bc1qserverdestination' }));
    expect(intent.quote.cryptoAmount).toBe('0.0001');
    expect(intent.settlementStatus).toBe('PENDING');
  });
});
