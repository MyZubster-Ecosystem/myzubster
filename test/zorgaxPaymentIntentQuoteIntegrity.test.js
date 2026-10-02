'use strict';

const { PaymentIntent, quotePlan, checkout, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('binds server quote and integer satoshis regardless of caller coordinates', async () => {
  const result = await checkout.createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', cryptoAmount: '10', priceEur: 0, destination: 'attacker' });
  expect(quotePlan).toHaveBeenCalledWith({ asset: 'BTC', priceEur: 9.9 });
  const stored = PaymentIntent.create.mock.calls[0][0];
  expect(stored.amountMinor).toBe(10000);
  expect(stored.metadata.zorgax.cryptoAmount).toBe(result.quote.cryptoAmount);
  expect(stored.metadata.zorgax.destination).not.toBe('attacker');
});
