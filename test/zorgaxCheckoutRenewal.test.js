'use strict';

const { PaymentIntent, ZorgaxPurchase, checkout, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test.each([true, false])('stores the renewal request (%s) on the owner purchase', async renew => {
  const result = await checkout.createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro', renew });
  expect(PaymentIntent.create.mock.calls[0][0].metadata.zorgax.renew).toBe(renew);
  expect(ZorgaxPurchase.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', metadata: expect.objectContaining({ renew }) }));
  expect(result.renewal).toBe(renew);
});
