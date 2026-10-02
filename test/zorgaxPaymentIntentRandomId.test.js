'use strict';

const { PaymentIntent, checkout, reset } = require('./helpers/zorgaxCheckoutFixture');
beforeEach(reset);
test('uses fresh cryptographically generated references even at the same timestamp', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000000);
  try {
    await checkout.createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro' });
    await checkout.createCheckoutIntent({ ownerId: 'owner-1', planId: 'pro' });
    const [first, second] = PaymentIntent.create.mock.calls.map(([document]) => document);
    expect(first.intentId).toMatch(/^zorgax_1000000_[a-f0-9]{16}$/);
    expect(first.intentId).not.toBe(second.intentId);
    expect(first.paymentReference).not.toBe(second.paymentReference);
  } finally { now.mockRestore(); }
});
