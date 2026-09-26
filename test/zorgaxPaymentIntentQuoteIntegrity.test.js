'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax quote integrity', () => {
  test('stores quoted crypto amount and owner binding in the unified checkout intent', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxUnifiedCheckoutService.js'), 'utf8');
    expect(source).toContain('ownerId:String(ownerId)');
    expect(source).toContain('cryptoAmount:quote.cryptoAmount');
    expect(source).toContain('expiresAt');
  });
});
