'use strict';

jest.mock('../src/models/PaymentIntent');
jest.mock('../src/models/ZorgaxPurchase', () => ({
  ZorgaxPurchase: { findOne: jest.fn() },
  PURCHASE_STATUSES: { CREDITED: 'CREDITED' }
}));
jest.mock('../src/services/zorgaxChainVerifierService');
jest.mock('../src/services/zorgaxEntitlementService');

const PaymentIntent = require('../src/models/PaymentIntent');
const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { verifySettlement } = require('../src/services/zorgaxChainVerifierService');
const { grantPurchaseEntitlement } = require('../src/services/zorgaxEntitlementService');
const { verifyAndActivatePaymentIntent } = require('../src/services/zorgaxPaymentIntentService');

function paymentIntent(overrides = {}) {
  return {
    intentId: 'zorgax_test',
    ownerId: 'owner-1',
    purpose: 'zorgax:pro',
    asset: 'BTC',
    amountMinor: 7212,
    status: 'AWAITING_PAYMENT',
    txId: null,
    submittedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    metadata: { zorgax: { plan: 'pro', destination: 'bc1qserverdestination', cryptoAmount: '0.00007212' } },
    save: jest.fn().mockResolvedValue(undefined),
    markModified: jest.fn(),
    ...overrides
  };
}

function purchase() {
  return {
    purchaseId: 'zpur_test',
    productId: 'zorgax-pro',
    entitlement: { key: 'zorgax.access', tier: 'PRO', durationDays: 30 },
    status: 'PENDING',
    creditedAt: null,
    save: jest.fn().mockResolvedValue(undefined)
  };
}

describe('Zorgax persisted payment intent activation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses immutable server-side intent values for verification and activation', async () => {
    const intent = paymentIntent();
    const linkedPurchase = purchase();
    PaymentIntent.findOne.mockResolvedValue(intent);
    ZorgaxPurchase.findOne.mockResolvedValue(linkedPurchase);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: 'a'.repeat(64), verifier: 'btc-test', confirmations: 1, amount: 0.00007212 });
    grantPurchaseEntitlement.mockResolvedValue({ status: 'ACTIVE' });

    const result = await verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'a'.repeat(64) });

    expect(PaymentIntent.findOne).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', intentId: 'zorgax_test' }));
    expect(verifySettlement).toHaveBeenCalledWith(expect.objectContaining({ asset: 'BTC', destination: 'bc1qserverdestination', cryptoAmount: '0.00007212' }));
    expect(grantPurchaseEntitlement).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', purchaseId: 'zpur_test' }));
    expect(intent.status).toBe('CONFIRMED');
    expect(linkedPurchase.status).toBe('CREDITED');
    expect(result.access.status).toBe('ACTIVE');
  });

  test('expires stale intents before calling a verifier', async () => {
    const intent = paymentIntent({ expiresAt: new Date(Date.now() - 1000) });
    PaymentIntent.findOne.mockResolvedValue(intent);

    await expect(verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'expired', paymentReference: 'b'.repeat(64) })).rejects.toThrow('Payment intent scaduto');
    expect(verifySettlement).not.toHaveBeenCalled();
    expect(intent.status).toBe('EXPIRED');
  });

  test('rejects a different TXID once an intent is already bound', async () => {
    const intent = paymentIntent({ status: 'SUBMITTED', txId: 'd'.repeat(64) });
    PaymentIntent.findOne.mockResolvedValue(intent);

    await expect(verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: 'used', paymentReference: 'c'.repeat(64) })).rejects.toThrow('Payment intent già associato a un altro TXID');
    expect(verifySettlement).not.toHaveBeenCalled();
  });
});
