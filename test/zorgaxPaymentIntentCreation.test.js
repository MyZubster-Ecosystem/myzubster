'use strict';

jest.mock('../src/models/PaymentIntent');
jest.mock('../src/models/ZorgaxPurchase', () => ({
  ZorgaxPurchase: { create: jest.fn() },
  PURCHASE_STATUSES: { PENDING: 'PENDING', CREDITED: 'CREDITED' }
}));
jest.mock('../src/services/zorgaxQuoteService', () => ({ quotePlan: jest.fn() }));

const PaymentIntent = require('../src/models/PaymentIntent');
const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { quotePlan } = require('../src/services/zorgaxQuoteService');
const { createCheckoutIntent } = require('../src/services/zorgaxUnifiedCheckoutService');

describe('Zorgax payment intent creation', () => {
  const previousWallet = process.env.ZORGAX_WALLET_BTC;
  afterAll(() => { process.env.ZORGAX_WALLET_BTC = previousWallet; });

  test('persists owner, quote, destination metadata and expiry server-side', async () => {
    process.env.ZORGAX_WALLET_BTC = 'bc1qserverdestination';
    quotePlan.mockResolvedValue({ cryptoAmount: '0.00010000', eurPerCoin: 99000, observedAt: new Date().toISOString(), source: 'test-provider' });
    PaymentIntent.create.mockImplementation(async value => ({ ...value }));
    ZorgaxPurchase.create.mockResolvedValue({});

    const intent = await createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', asset: 'BTC' });
    expect(PaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'owner-1',
      purpose: expect.stringMatching(/^zorgax:/),
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000,
      status: 'AWAITING_PAYMENT',
      expiresAt: expect.any(Date),
      metadata: { zorgax: expect.objectContaining({ plan: 'pro', cryptoAmount: '0.00010000', destination: 'bc1qserverdestination' }) }
    }));
    expect(intent.quote.cryptoAmount).toBe('0.00010000');
    expect(intent.destination).toBe('bc1qserverdestination');
    expect(intent.settlementStatus).toBe('PENDING');
  });
});
