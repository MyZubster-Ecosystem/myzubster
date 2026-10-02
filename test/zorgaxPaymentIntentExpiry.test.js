'use strict';

const { PaymentIntent, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('expires an unpaid stale intent when read', async () => {
  const intent = paymentIntent({ expiresAt: new Date(Date.now() - 1000) });
  PaymentIntent.findOne.mockResolvedValue(intent);
  const result = await checkout.getPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId });
  expect(result.settlementStatus).toBe('EXPIRED');
  expect(intent.status).toBe('EXPIRED');
  expect(intent.save).toHaveBeenCalled();
});
