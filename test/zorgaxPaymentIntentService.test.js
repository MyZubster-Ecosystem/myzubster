'use strict';
const { PaymentIntent, verifySettlement, grantPurchaseEntitlement, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('activates the persisted purchase after a verified payment', async () => {
  const intent = paymentIntent();
  PaymentIntent.findOne.mockResolvedValue(intent);
  const result = await checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId, paymentReference: 'a'.repeat(64) });
  expect(verifySettlement).toHaveBeenCalledWith(expect.objectContaining({ destination: 'bc1qserverdestination', cryptoAmount: '0.00007212' }));
  expect(grantPurchaseEntitlement).toHaveBeenCalledTimes(1);
  expect(intent.status).toBe('CONFIRMED');
  expect(intent.confirmedAt).toBeInstanceOf(Date);
  expect(result.access.status).toBe('ACTIVE');
});
test('expires a stale unpaid intent before invoking the verifier', async () => {
  const intent = paymentIntent({ expiresAt: new Date(Date.now() - 1000) });
  PaymentIntent.findOne.mockResolvedValue(intent);
  await expect(checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId, paymentReference: 'b'.repeat(64) })).rejects.toThrow('Payment intent scaduto');
  expect(verifySettlement).not.toHaveBeenCalled();
  expect(intent.status).toBe('EXPIRED');
});
test('returns confirmation idempotently without granting access again', async () => {
  PaymentIntent.findOne.mockResolvedValue(paymentIntent({ status: 'CONFIRMED', txId: 'c'.repeat(64) }));
  await expect(checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'c'.repeat(64) })).resolves.toMatchObject({ verified: true });
  expect(verifySettlement).not.toHaveBeenCalled();
  expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
});
