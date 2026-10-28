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

function atomicInteger(value, field) {
  if (typeof value === 'bigint' && value >= 0n) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value) && !/\s/.test(value)) {
    return BigInt(value);
  }
  throw new TypeError(`${field} must be a non-negative integer in atomic units (bigint, canonical decimal string, or safe integer number)`);
}

// Offline arithmetic only: neither payment eligibility nor settlement evidence.
// Fees must be exact; rounding and refund allocation require separate policy.
function calculateAtomicPlatformQuote(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Quote input must be an object');
  }
  const { unitAmountAtomic, quantity = 1, exchangeType } = input;
  if (!['PAID', 'FREE', 'BARTER'].includes(exchangeType)) {
    throw new TypeError('exchangeType must be PAID, FREE, or BARTER');
  }
  const unitAmount = atomicInteger(unitAmountAtomic, 'unitAmountAtomic');
  const units = atomicInteger(quantity, 'quantity');
  if (units === 0n) throw new TypeError('quantity must be a positive integer');

  const gross = unitAmount * units;
  let fee = 0n;
  if (exchangeType === 'PAID') {
    const numerator = gross * BigInt(MARKETPLACE_PLATFORM_COMMISSION_PERCENT);
    if (numerator % 100n !== 0n) {
      const error = new Error('ROUNDING_POLICY_REQUIRED: platform fee is not an integer atomic amount');
      error.code = 'ROUNDING_POLICY_REQUIRED';
      throw error;
    }
    fee = numerator / 100n;
  }

  return {
    status: 'QUOTE_ONLY',
    grossAtomic: gross.toString(),
    platformFeeAtomic: fee.toString(),
    sellerNetAtomic: (gross - fee).toString(),
    networkCostsAtomic: null,
    processorCostsAtomic: null
  };
}

module.exports = {
  FREE_SELLER_ACTIVE_LISTING_LIMIT,
  MARKETPLACE_PLATFORM_COMMISSION_RATE,
  MARKETPLACE_PLATFORM_COMMISSION_PERCENT,
  freeSellerPlan,
  isFreeSellerActive,
  canPublishCommercialListing,
  requiresPaymentOnboarding,
  calculatePlatformCommission,
  calculateAtomicPlatformQuote
};
