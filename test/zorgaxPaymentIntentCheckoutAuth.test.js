'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax checkout authentication', () => {
  test('checkout intent creation is authenticated and passes req.userId', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'), 'utf8');
    expect(source).toContain("router.post('/checkout/intent', authenticate");
    expect(source).toContain('ownerId: req.userId');
  });
});
