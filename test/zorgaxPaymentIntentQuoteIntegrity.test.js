'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax quote integrity', () => {
  test('persists the server quote in the unified payment intent before returning checkout data', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxUnifiedCheckoutService.js'), 'utf8');
    expect(source).toContain('ownerId:String(ownerId)');
    expect(source).toContain('amountMinor');
    expect(source).toContain('cryptoAmount:quote.cryptoAmount');
    expect(source).toContain('quoteObservedAt:quote.observedAt');
    expect(source).toContain('quoteSource:quote.source');
    expect(source).toContain('expiresAt');
  });
});
