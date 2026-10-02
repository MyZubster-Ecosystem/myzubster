'use strict';

const PaymentIntent = require('../src/models/PaymentIntent');

describe('Zorgax payment intent lifecycle', () => {
  test('uses the shared payment lifecycle states', () => {
    expect(PaymentIntent.PAYMENT_INTENT_STATES).toEqual(expect.arrayContaining([
      'PENDING', 'AWAITING_PAYMENT', 'SUBMITTED', 'CONFIRMED', 'EXPIRED', 'FAILED', 'CANCELLED'
    ]));
  });
});
