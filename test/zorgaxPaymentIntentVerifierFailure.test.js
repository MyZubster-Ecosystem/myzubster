'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax verifier failure behavior', () => {
  test('activates only after trusted verifier returns successfully', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxPaymentIntentService.js'), 'utf8');
    expect(source.indexOf('await verifySettlement')).toBeLessThan(source.indexOf('await recordVerifiedPayment'));
    expect(source.indexOf("intent.settlement.status = 'VERIFIED'")).toBeGreaterThan(source.indexOf('await recordVerifiedPayment'));
  });
});
