'use strict';

const PaymentIntent = require('../src/models/PaymentIntent');
const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('ZorgaxPaymentIntent compatibility model', () => {
  test('aliases the shared PaymentIntent model and requires server-owned settlement fields', () => {
    expect(ZorgaxPaymentIntent).toBe(PaymentIntent);
    const validation = new ZorgaxPaymentIntent({ intentId: 'zorgax_test', ownerId: 'owner-1' }).validateSync();
    for (const field of ['purpose', 'asset', 'network', 'amountMinor', 'paymentReference', 'expiresAt']) {
      expect(validation.errors[field]).toBeDefined();
    }
  });
});
