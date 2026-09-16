'use strict';

const fs = require('fs');
const path = require('path');
const {
  freeSellerPlan,
  requiresPaymentOnboarding,
  calculatePlatformCommission
} = require('../src/services/freeSellerPolicy');

describe('Seller monetization guardrails', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'sellerRoutes.js'), 'utf8');

  test('keeps basic Seller activation free with no payment method', () => {
    const plan = freeSellerPlan();
    expect(plan.id).toBe('SELLER_FREE');
    expect(plan.amount).toBe(0);
    expect(plan.paymentMethodRequired).toBe(false);
    expect(plan.automaticPaidConversion).toBe(false);
    expect(plan.paymentActivation).toBe('AT_FIRST_REAL_EARNING_OR_PAYOUT_ATTEMPT');
  });

  test('requires payment onboarding only when monetization actually starts', () => {
    expect(requiresPaymentOnboarding()).toMatchObject({ required:false, monetizationStarted:false });
    expect(requiresPaymentOnboarding({ isPaidTransaction:true, sellerCanReceiveFunds:false })).toMatchObject({
      required:true,
      monetizationStarted:true,
      commissionPercent:2
    });
    expect(requiresPaymentOnboarding({ payoutRequested:true, sellerCanReceiveFunds:true })).toMatchObject({
      required:false,
      monetizationStarted:true,
      commissionPercent:2
    });
  });

  test('calculates the 2 percent platform commission', () => {
    expect(calculatePlatformCommission(100)).toBe(2);
    expect(calculatePlatformCommission(9.9)).toBe(0.2);
    expect(calculatePlatformCommission(0)).toBe(0);
  });

  test('initial Seller route no longer creates Stripe subscription checkout', () => {
    expect(source).toContain("plan:'SELLER_FREE'");
    expect(source).toContain("paymentProvider:'NONE'");
    expect(source).toContain("code:'SELLER_CHECKOUT_NOT_REQUIRED'");
    expect(source).not.toContain("FIRST_30_DAYS_FREE_THEN_MONTHLY");
    expect(source).not.toContain("trial_period_days");
  });

  test('preserves legacy Stripe subscription synchronization without making it the default', () => {
    expect(source).toContain('syncLegacyStripeSubscription');
    expect(source).toContain("plan:'SELLER_MONTHLY'");
    expect(source).toContain("event.type === 'invoice.paid'");
  });
});
