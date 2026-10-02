'use strict';

const PaymentIntent = require('../src/models/PaymentIntent');
const { publicIntent } = require('../src/services/zorgaxUnifiedCheckoutService');

describe('Zorgax payment intent lifecycle', () => {
  test('uses the canonical payment intent storage states', () => {
    expect(PaymentIntent.PAYMENT_INTENT_STATES).toEqual(
      expect.arrayContaining([
        'PENDING',
        'AWAITING_PAYMENT',
        'SUBMITTED',
        'CONFIRMED',
        'EXPIRED',
        'FAILED',
        'CANCELLED'
      ])
    );
  });

  test.each([
    ['CONFIRMED', 'VERIFIED'],
    ['EXPIRED', 'EXPIRED'],
    ['PENDING', 'PENDING'],
    ['AWAITING_PAYMENT', 'PENDING'],
    ['SUBMITTED', 'PENDING']
  ])('maps %s storage state to %s public state', (status, settlementStatus) => {
    const intent = publicIntent({
      intentId: 'zorgax_test',
      asset: 'BTC',
      amountMinor: 1,
      status,
      metadata: {
        zorgax: {
          plan: 'test',
          priceEur: 1,
          cryptoAmount: '0.00000001'
        }
      }
    });

    expect(intent.settlementStatus).toBe(settlementStatus);
  });
});
