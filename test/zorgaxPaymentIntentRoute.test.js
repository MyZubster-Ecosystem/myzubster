'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax payment intent route safety', () => {
  test('verification route accepts a payment reference but not client payment coordinates', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'), 'utf8');
    expect(source).toContain("router.post('/checkout/intent/:intentId/verify', authenticate");
    expect(source).toContain('paymentReference: req.body?.paymentReference');
    expect(source).not.toContain('destination: req.body?.destination');
    expect(source).not.toContain('cryptoAmount: req.body?.cryptoAmount');
    expect(source).not.toContain('planId: req.body?.planId');
  });
});
