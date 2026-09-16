const FREE_SELLER_ACTIVE_LISTING_LIMIT = 5;
const MARKETPLACE_PLATFORM_COMMISSION_RATE = 0.02;
const MARKETPLACE_PLATFORM_COMMISSION_PERCENT = 2;

function freeSellerPlan() {
  return {
    id: 'SELLER_FREE',
    name: 'MyZubster Seller Free',
    amount: 0,
    currency: 'EUR',
    interval: null,
    activeListingLimit: FREE_SELLER_ACTIVE_LISTING_LIMIT,
    paymentMethodRequired: false,
    bankingInformationRequired: false,
    automaticPaidConversion: false,
    paymentActivation: 'AT_FIRST_REAL_EARNING_OR_PAYOUT_ATTEMPT',
    platformCommissionRate: MARKETPLACE_PLATFORM_COMMISSION_RATE,
    platformCommissionPercent: MARKETPLACE_PLATFORM_COMMISSION_PERCENT,
    message: 'Pubblica gratis. Paghi solo quando inizi a guadagnare.',
    benefits: [
      'seller profile',
      'up to 5 active commercial listings',
      'listing and stock management',
      'marketplace requests',
      'basic private messaging',
      'reputation from completed exchanges'
    ]
  };
}

function isFreeSellerActive(membership) {
  return Boolean(membership && membership.plan === 'SELLER_FREE' && membership.status === 'ACTIVE');
}

function canPublishCommercialListing(membership, activeCommercialListings) {
  if (!isFreeSellerActive(membership)) return { allowed: false, reason: 'SELLER_ACTIVATION_REQUIRED' };
  if (Number(activeCommercialListings) >= FREE_SELLER_ACTIVE_LISTING_LIMIT) {
    return {
      allowed: false,
      reason: 'FREE_SELLER_ACTIVE_LISTING_LIMIT',
      limit: FREE_SELLER_ACTIVE_LISTING_LIMIT,
      paymentRequired: false,
      automaticCharge: false
    };
  }
  return { allowed: true, limit: FREE_SELLER_ACTIVE_LISTING_LIMIT };
}

function requiresPaymentOnboarding({ isPaidTransaction = false, payoutRequested = false, sellerCanReceiveFunds = false } = {}) {
  const monetizationStarted = Boolean(isPaidTransaction || payoutRequested);
  const required = monetizationStarted && !sellerCanReceiveFunds;
  return {
    required,
    monetizationStarted,
    commissionRate: MARKETPLACE_PLATFORM_COMMISSION_RATE,
    commissionPercent: MARKETPLACE_PLATFORM_COMMISSION_PERCENT,
    reason: required ? 'FIRST_REAL_EARNING_REQUIRES_PAYMENT_ONBOARDING' : null
  };
}

function calculatePlatformCommission(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new TypeError('Transaction amount must be a non-negative number');
  return Math.round(value * MARKETPLACE_PLATFORM_COMMISSION_RATE * 100) / 100;
}

module.exports = {
  FREE_SELLER_ACTIVE_LISTING_LIMIT,
  MARKETPLACE_PLATFORM_COMMISSION_RATE,
  MARKETPLACE_PLATFORM_COMMISSION_PERCENT,
  freeSellerPlan,
  isFreeSellerActive,
  canPublishCommercialListing,
  requiresPaymentOnboarding,
  calculatePlatformCommission
};