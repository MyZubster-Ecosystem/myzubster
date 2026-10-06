'use strict';

jest.mock('../../src/models/PaymentIntent', () => ({ create: jest.fn(), findOne: jest.fn(), find: jest.fn() }));
jest.mock('../../src/models/ZorgaxPurchase', () => ({
  ZorgaxPurchase: { create: jest.fn(), findOne: jest.fn() },
  PURCHASE_STATUSES: { PENDING: 'PENDING', CREDITED: 'CREDITED' }
}));
jest.mock('../../src/services/zorgaxQuoteService', () => ({ quotePlan: jest.fn() }));
jest.mock('../../src/services/zorgaxChainVerifierService', () => ({ verifySettlement: jest.fn() }));
jest.mock('../../src/services/zorgaxEntitlementService', () => ({ grantPurchaseEntitlement: jest.fn() }));

const PaymentIntent = require('../../src/models/PaymentIntent');
const { ZorgaxPurchase } = require('../../src/models/ZorgaxPurchase');
const { quotePlan } = require('../../src/services/zorgaxQuoteService');
const { verifySettlement } = require('../../src/services/zorgaxChainVerifierService');
const { grantPurchaseEntitlement } = require('../../src/services/zorgaxEntitlementService');
const checkout = require('../../src/services/zorgaxUnifiedCheckoutService');

function paymentIntent(overrides = {}) {
  return {
    intentId: 'zorgax_test', ownerId: 'owner-1', purpose: 'zorgax:zorgax_pro_monthly',
    asset: 'BTC', network: 'bitcoin', amountMinor: 7212, paymentReference: 'zorgaxref_test',
    status: 'AWAITING_PAYMENT', txId: null, expiresAt: new Date(Date.now() + 60000),
    metadata: { zorgax: { plan: 'pro', priceEur: 9.9, destination: 'bc1qserverdestination', cryptoAmount: '0.00007212', checkAttempts: 0 } },
    save: jest.fn().mockResolvedValue(undefined), markModified: jest.fn(), ...overrides
  };
}

function reset() {
  jest.resetAllMocks();
  quotePlan.mockResolvedValue({ cryptoAmount: '0.0001', eurPerCoin: 99000, observedAt: new Date().toISOString(), source: 'test-provider' });
  PaymentIntent.create.mockImplementation(async document => ({ ...document }));
  ZorgaxPurchase.create.mockImplementation(async document => ({ ...document }));
  ZorgaxPurchase.findOne.mockResolvedValue({ purchaseId: 'purchase-1', productId: 'zorgax_pro_monthly', entitlement: { key: 'zorgax.access', tier: 'PRO', durationDays: 30 }, save: jest.fn().mockResolvedValue(undefined) });
  verifySettlement.mockResolvedValue({ verified: true, paymentReference: 'a'.repeat(64), confirmations: 1 });
  grantPurchaseEntitlement.mockResolvedValue({ tier: 'PRO', active: true });
}

module.exports = { PaymentIntent, ZorgaxPurchase, quotePlan, verifySettlement, grantPurchaseEntitlement, checkout, paymentIntent, reset };
