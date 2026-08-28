'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { getPaymentIntent } = require('../src/services/zorgaxMonetizationService');

describe('Zorgax payment intent ownership', () => {
  test('queries intents by both intentId and authenticated owner', async () => {
    ZorgaxPaymentIntent.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await expect(getPaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test' })).rejects.toThrow('Payment intent non trovato');
    expect(ZorgaxPaymentIntent.findOne).toHaveBeenCalledWith({ intentId: 'zorgax_test', ownerId: 'owner-1' });
  });
});
