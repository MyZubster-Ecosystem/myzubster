'use strict';

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('ZorgaxPaymentIntent model', () => {
  test('requires server-side payment coordinates', () => {
    const validation = new ZorgaxPaymentIntent({ intentId: 'zorgax_test', ownerId: 'owner-1' }).validateSync();
    expect(validation.errors.purpose).toBeDefined();
    expect(validation.errors.asset).toBeDefined();
    expect(validation.errors.network).toBeDefined();
    expect(validation.errors.amountMinor).toBeDefined();
    expect(validation.errors.paymentReference).toBeDefined();
    expect(validation.errors.expiresAt).toBeDefined();
  });
});
