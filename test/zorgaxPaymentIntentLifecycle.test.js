const PaymentIntent = require('../src/models/PaymentIntent');
test('rejects states outside the unified intent lifecycle', () => {
  expect(PaymentIntent.schema.path('status').enumValues).toEqual(['PENDING', 'AWAITING_PAYMENT', 'SUBMITTED', 'CONFIRMED', 'EXPIRED', 'FAILED', 'CANCELLED']);
  expect(new PaymentIntent({ status: 'VERIFIED' }).validateSync().errors.status).toBeDefined();
});
