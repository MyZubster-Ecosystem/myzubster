'use strict';
const { PaymentIntent, verifySettlement, grantPurchaseEntitlement, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('persists a TXID and schedules a retry when confirmations are insufficient', async () => {
  const intent = paymentIntent();
  PaymentIntent.findOne.mockResolvedValue(intent);
  verifySettlement.mockRejectedValue(new Error('Conferme blockchain insufficienti'));
  const result = await checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId, paymentReference: 'a'.repeat(64) });
  expect(result).toMatchObject({ pending: true, automaticMonitoring: true, paymentReference: 'a'.repeat(64) });
  expect(intent.txId).toBe('a'.repeat(64));
  expect(intent.submittedAt).toBeInstanceOf(Date);
  expect(intent.metadata.zorgax.nextCheckAt).toBeInstanceOf(Date);
  expect(intent.metadata.zorgax.checkAttempts).toBe(1);
  expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
});
test.each([false, true])('confirms a submitted TXID even after quote expiry (%s)', async expired => {
  const intent = paymentIntent({ txId: 'b'.repeat(64), status: 'SUBMITTED', expiresAt: new Date(Date.now() + (expired ? -5000 : 60000)), submittedAt: new Date(Date.now() - 10000) });
  PaymentIntent.findOne.mockResolvedValue(intent);
  await expect(checkout.refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId })).resolves.toMatchObject({ pending: false, verified: true, plan: 'pro' });
  expect(intent.status).toBe('CONFIRMED');
  expect(intent.confirmedAt).toBeInstanceOf(Date);
  expect(grantPurchaseEntitlement).toHaveBeenCalledTimes(1);
});
test('cannot replace an already bound transaction', async () => {
  PaymentIntent.findOne.mockResolvedValue(paymentIntent({ txId: 'a'.repeat(64), status: 'SUBMITTED' }));
  await expect(checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'b'.repeat(64) })).rejects.toThrow('altro TXID');
  expect(verifySettlement).not.toHaveBeenCalled();
});
