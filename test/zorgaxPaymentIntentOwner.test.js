'use strict';

jest.mock('../src/models/PaymentIntent');

const PaymentIntent = require('../src/models/PaymentIntent');
const { getPaymentIntent } = require('../src/services/zorgaxUnifiedCheckoutService');

describe('Zorgax payment intent ownership', () => {
  test('queries intents by both intentId and authenticated owner', async () => {
    PaymentIntent.findOne.mockResolvedValue(null);

    await expect(
      getPaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test' })
    ).rejects.toThrow('Payment intent non trovato');

    expect(PaymentIntent.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'owner-1',
        intentId: 'zorgax_test',
        purpose: expect.any(RegExp)
      })
    );
    expect(PaymentIntent.findOne.mock.calls[0][0].purpose.source).toBe('^zorgax:');
  });
});
