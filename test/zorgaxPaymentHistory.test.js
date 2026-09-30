'use strict';

const { PaymentIntent, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('returns owner-scoped history with tracking and no account identifiers', async () => {
  const intent = paymentIntent({ txId: 'e'.repeat(64), submittedAt: new Date() });
  intent.metadata.zorgax.checkAttempts = 2;
  const limit = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([intent]) });
  PaymentIntent.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ limit }) });
  const result = await checkout.listPaymentIntents({ ownerId: 'owner-1', limit: 10 });
  expect(PaymentIntent.find).toHaveBeenCalledWith({ ownerId: 'owner-1', purpose: /^zorgax:/ });
  expect(limit).toHaveBeenCalledWith(10);
  expect(result[0]).toMatchObject({ intentId: intent.intentId, settlementStatus: 'PENDING', tracking: { automatic: true, checkAttempts: 2 } });
  expect(result[0].ownerId).toBeUndefined();
});
