'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax payment intent read route', () => {
  test('requires authentication', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'), 'utf8');
    expect(source).toContain("router.get('/checkout/intent/:intentId', authenticate");
  });
});
