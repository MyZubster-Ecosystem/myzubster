'use strict';

const { PaymentIntent, verifySettlement, grantPurchaseEntitlement, checkout, paymentIntent, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test.each(['rejected', 'unverified'])('never activates on %s verification', async mode => {
  const intent = paymentIntent();
  PaymentIntent.findOne.mockResolvedValue(intent);
  if (mode === 'rejected') verifySettlement.mockRejectedValue(new Error('Importo insufficiente'));
  else verifySettlement.mockResolvedValue({ verified: false });
  await expect(checkout.verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId, paymentReference: 'a'.repeat(64) })).rejects.toThrow();
  expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
  expect(intent.status).not.toBe('CONFIRMED');
});
