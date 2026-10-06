'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax billing UI', () => {
  const source = fs.readFileSync(path.join(__dirname, '../public/zorgax.html'), 'utf8');

  test('restores pending payments and polls the trusted refresh endpoint', () => {
    expect(source).toContain("'/refresh'");
    expect(source).toContain('startPaymentMonitoring');
    expect(source).toContain('monitoraggio automatico');
    expect(source).toContain("intent.settlementStatus==='PENDING'&&intent.paymentReference");
  });

  test('shows authenticated payment history and downloads owner-scoped receipts', () => {
    expect(source).toContain("'/api/zorgax/assistant/checkout/history?limit=10'");
    expect(source).toContain("'/receipt'");
    expect(source).toContain('Scarica ricevuta');
  });

  test('requests server-resolved renewal without sending a subscription id', () => {
    expect(source).toContain("JSON.stringify({plan:selectedPlan,asset:'BTC',renew})");
    expect(source).not.toContain('renewalOf:');
  });
});
