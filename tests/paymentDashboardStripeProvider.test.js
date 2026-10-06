'use strict';

const { normalizeCharge } = require('../src/services/paymentDashboardStripeProvider');

describe('payment dashboard Stripe read-only provider', () => {
  test('maps a successful paid charge to SETTLED without changing funds', () => {
    const item = normalizeCharge({
      id: 'ch_test', amount: 1200, amount_refunded: 0, currency: 'eur',
      status: 'succeeded', paid: true, refunded: false, created: 1700000000,
      balance_transaction: 'txn_test', livemode: false, metadata: { product: 'zorgax' }
    });
    expect(item).toMatchObject({ reference: 'ch_test', txId: 'txn_test', asset: 'EUR', amount: 12, status: 'SETTLED', provider: 'stripe', livemode: false });
  });

  test('subtracts refunds and never fabricates settlement', () => {
    const item = normalizeCharge({ id: 'ch_refund', amount: 1200, amount_refunded: 500, currency: 'eur', status: 'succeeded', paid: true, refunded: true });
    expect(item.amount).toBe(7);
    expect(item.status).toBe('CONFIRMED');
  });
});
