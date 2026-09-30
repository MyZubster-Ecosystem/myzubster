'use strict';

const { PaymentIntent, verifySettlement, grantPurchaseEntitlement, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('verifies persisted coordinates and grants only the owner purchase entitlement', async () => {
  PaymentIntent.findOne.mockResolvedValue(paymentIntent());
  await checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'a'.repeat(64), destination: 'attacker', cryptoAmount: '0' });
  expect(verifySettlement).toHaveBeenCalledWith({ asset: 'BTC', paymentReference: 'a'.repeat(64), destination: 'bc1qserverdestination', cryptoAmount: '0.00007212' });
  expect(grantPurchaseEntitlement).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', purchaseId: 'purchase-1', tier: 'PRO', durationDays: 30 }));
});
