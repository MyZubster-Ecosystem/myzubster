'use strict';

const { PaymentIntent, checkout, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('queries by authenticated owner, intent id and Zorgax purpose', async () => {
  PaymentIntent.findOne.mockResolvedValue(null);
  await expect(checkout.getPaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test' })).rejects.toThrow('Payment intent non trovato');
  expect(PaymentIntent.findOne).toHaveBeenCalledWith({ ownerId: 'owner-1', intentId: 'zorgax_test', purpose: /^zorgax:/ });
});
