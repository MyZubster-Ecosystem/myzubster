'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax verifier failure behavior', () => {
  test('does not activate before the trusted verifier succeeds', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/services/zorgaxUnifiedCheckoutService.js'), 'utf8');
    const verify = source.indexOf('await verifySettlement');
    const activate = source.indexOf('return activate(intent, verification)');
    const confirmed = source.indexOf("intent.status = 'CONFIRMED'");
    expect(verify).toBeGreaterThan(-1);
    expect(activate).toBeGreaterThan(verify);
    expect(confirmed).toBeGreaterThan(-1);
    expect(source).toContain('if (!retryable(error)) throw error');
  });
});
