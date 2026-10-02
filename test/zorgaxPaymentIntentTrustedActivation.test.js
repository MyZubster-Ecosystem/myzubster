'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax trusted payment activation boundary', () => {
  test('verifies persisted settlement coordinates before granting entitlement', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxUnifiedCheckoutService.js'), 'utf8');
    expect(source).toContain("verifySettlement({ asset:'BTC'");
    expect(source).toContain('paymentReference:intent.txId');
    expect(source).toContain('destination:z.destination');
    expect(source).toContain('cryptoAmount:z.cryptoAmount');
    expect(source.indexOf('await verifySettlement')).toBeLessThan(source.indexOf('return activate(intent, verification)'));
    expect(source.indexOf('await grantPurchaseEntitlement')).toBeLessThan(source.indexOf("intent.status = 'CONFIRMED'"));
  });
});
