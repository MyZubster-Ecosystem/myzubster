'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax payment intent identifiers', () => {
  test('uses cryptographic randomness instead of Math.random', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxMonetizationService.js'), 'utf8');
    expect(source).toContain("crypto.randomBytes(8).toString('hex')");
    expect(source).not.toContain('Math.random()');
  });
});
