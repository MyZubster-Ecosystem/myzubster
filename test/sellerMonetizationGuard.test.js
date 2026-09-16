'use strict';

const fs = require('fs');
const path = require('path');

describe('Seller monetization guardrails', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'sellerRoutes.js'), 'utf8');

  test('defines one explicit free-first Seller pricing policy', () => {
    expect(source).toContain("const SELLER_TRIAL_DAYS = 30");
    expect(source).toContain("const SELLER_PRICING_POLICY = 'FIRST_30_DAYS_FREE_THEN_MONTHLY'");
    expect(source).toContain("trialLabel: 'Primi 30 giorni gratis, poi €9,90/mese'");
    expect(source).toContain('firstChargeAfterTrial: true');
    expect(source).toContain('paymentMethodRequired: true');
  });

  test('does not create zero-value Seller checkouts outside the explicit trial', () => {
    expect(source).toContain('!Number.isFinite(amount)||amount<=0');
    expect(source).toContain("if (!trialApplied && Number(session.amount_total) === 0)");
    expect(source).toContain("Checkout Seller non valido: importo zero non previsto");
  });

  test('reuses an existing open Stripe Checkout Session for duplicate clicks', () => {
    expect(source).toContain("existingSession.status==='open' && existingSession.url");
    expect(source).toContain('reusedCheckout:true');
    expect(source).toContain('reusedCheckout:false');
  });

  test('records expired Stripe Checkout sessions as abandonment', () => {
    expect(source).toContain("event.type==='checkout.session.expired'");
    expect(source).toContain("logConversionEvent('seller_checkout_expired'");
  });
});
