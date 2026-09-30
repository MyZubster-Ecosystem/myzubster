'use strict';

const { PaymentIntent, ZorgaxPurchase, checkout, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('persists owner, quote, destination and expiry before returning checkout data', async () => {
  const result = await checkout.createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', asset: 'BTC' });
  const stored = PaymentIntent.create.mock.calls[0][0];
  expect(stored).toMatchObject({ ownerId: 'owner-1', purpose: 'zorgax:zorgax_pro_monthly', amountMinor: 10000, status: 'AWAITING_PAYMENT', metadata: { zorgax: { plan: 'pro', cryptoAmount: '0.0001' } } });
  expect(stored.metadata.zorgax.destination).toBeTruthy();
  expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  expect(ZorgaxPurchase.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', paymentIntentId: stored.intentId }));
  expect(result.quote.cryptoAmount).toBe('0.0001');
  expect(result.settlementStatus).toBe('PENDING');
  expect(result.ownerId).toBeUndefined();
});
