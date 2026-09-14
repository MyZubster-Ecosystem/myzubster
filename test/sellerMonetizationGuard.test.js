'use strict';

const fs = require('fs');
const path = require('path');

describe('Seller monetization guardrails', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'sellerRoutes.js'), 'utf8');

  test('does not create zero-value Seller checkouts by default', () => {
    expect(source).toContain("MARKETPLACE_SELLER_TRIAL_ENABLED || ''");
    expect(source).toContain("if (!enabled) return 0");
    expect(source).toContain('!Number.isFinite(amount)||amount<=0');
    expect(source).toContain("Checkout Seller non valido: importo zero non previsto");
  });

  test('records expired Stripe Checkout sessions as abandonment', () => {
    expect(source).toContain("event.type==='checkout.session.expired'");
    expect(source).toContain("logConversionEvent('seller_checkout_expired'");
  });
});
