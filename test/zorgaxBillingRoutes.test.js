'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax billing routes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'), 'utf8');

  test('protects payment monitoring, history and receipts with authentication', () => {
    expect(source).toContain("router.post('/checkout/intent/:intentId/refresh', authenticate");
    expect(source).toContain("router.get('/checkout/history', authenticate");
    expect(source).toContain("router.get('/checkout/intent/:intentId/receipt', authenticate");
  });

  test('persists renewal intent at checkout and does not trust renewal ids at verification', () => {
    expect(source).toContain('renew: req.body?.renew === true');
    expect(source).not.toContain('renewalOf: req.body?.renewalOf');
  });
});
