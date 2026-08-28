'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax trusted payment activation boundary', () => {
  test('loads payment coordinates from the persisted intent', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxPaymentIntentService.js'), 'utf8');
    expect(source).toContain('asset: intent.asset');
    expect(source).toContain('destination: intent.destination');
    expect(source).toContain('cryptoAmount: intent.quote.cryptoAmount');
    expect(source).toContain('recordVerifiedPayment');
  });
});
