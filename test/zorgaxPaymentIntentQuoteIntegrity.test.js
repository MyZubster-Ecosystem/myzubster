'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax quote integrity', () => {
  test('stores quoted crypto amount before returning checkout data', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxLegacyMonetizationService.js'), 'utf8');
    expect(source).toContain('cryptoAmount: String(quote.cryptoAmount)');
    expect(source).toContain('ownerId: String(ownerId)');
    expect(source).toContain('expiresAt');
  });
});
