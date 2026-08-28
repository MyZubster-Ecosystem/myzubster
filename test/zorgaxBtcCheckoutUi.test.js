'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax BTC checkout UI', () => {
  const source = fs.readFileSync(path.join(__dirname, '../public/zorgax.html'), 'utf8');

  test('creates authenticated BTC payment intents for paid plans', () => {
    expect(source).toContain("'/api/zorgax/assistant/checkout/intent'");
    expect(source).toContain("asset:'BTC'");
    expect(source).toContain("'Authorization':'Bearer '+t");
  });

  test('submits only intent id and payment reference for verification', () => {
    expect(source).toContain("'/verify'");
    expect(source).toContain('JSON.stringify({paymentReference:txid})');
    expect(source).not.toContain('JSON.stringify({paymentReference:txid,destination:');
    expect(source).not.toContain('JSON.stringify({paymentReference:txid,cryptoAmount:');
  });

  test('validates Bitcoin txid before calling verification endpoint', () => {
    expect(source).toContain('/^[0-9a-fA-F]{64}$/');
  });

  test('keeps signing and fund movement outside Zorgax', () => {
    expect(source).toContain('Zorgax non firma né invia fondi.');
    expect(source).not.toContain('privateKey');
    expect(source).not.toContain('seedPhrase');
  });
});
