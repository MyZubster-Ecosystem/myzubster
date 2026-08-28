'use strict';

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('ZorgaxPaymentIntent model', () => {
  test('requires server-side payment coordinates', () => {
    const validation = new ZorgaxPaymentIntent({ intentId: 'zorgax_test', ownerId: 'owner-1' }).validateSync();
    expect(validation.errors.plan).toBeDefined();
    expect(validation.errors.asset).toBeDefined();
    expect(validation.errors.destination).toBeDefined();
    expect(validation.errors.expiresAt).toBeDefined();
  });
});
