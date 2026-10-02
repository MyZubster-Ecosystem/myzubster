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
const { refreshPaymentIntent, verifyAndActivatePaymentIntent } = require('../src/services/zorgaxPaymentIntentService');

function paymentIntent(overrides = {}) {
  return {
    intentId: 'zorgax_monitor',
    ownerId: 'owner-1',
    purpose: 'zorgax:pro',
    asset: 'BTC',
    amountMinor: 14728,
    status: 'AWAITING_PAYMENT',
    txId: null,
    submittedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    metadata: { zorgax: { plan: 'pro', destination: 'bc1qserverdestination', cryptoAmount: '0.00014728', confirmations: 0, checkAttempts: 0 } },
    save: jest.fn().mockResolvedValue(undefined),
    markModified: jest.fn(),
    ...overrides
  };
}

function purchase() {
  return {
    purchaseId: 'zpur_monitor',
    productId: 'zorgax-pro',
    entitlement: { key: 'zorgax.access', tier: 'PRO', durationDays: 30 },
    status: 'PENDING',
    creditedAt: null,
    save: jest.fn().mockResolvedValue(undefined)
  };
}

describe('Zorgax automatic payment monitoring', () => {
  beforeEach(() => jest.clearAllMocks());

  test('persists a valid TXID when confirmations are still insufficient', async () => {
    const intent = paymentIntent();
    const txid = 'a'.repeat(64);
    PaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockRejectedValue(new Error('Conferme blockchain insufficienti'));

    const result = await verifyAndActivatePaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId, paymentReference: txid });

    expect(result).toMatchObject({ pending: true, automaticMonitoring: true, paymentReference: txid });
    expect(intent.txId).toBe(txid);
    expect(intent.submittedAt).toBeInstanceOf(Date);
    expect(intent.metadata.zorgax.nextCheckAt).toBeInstanceOf(Date);
    expect(intent.metadata.zorgax.checkAttempts).toBe(1);
    expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
  });

  test('refreshes a persisted TXID and activates access after confirmation', async () => {
    const txid = 'b'.repeat(64);
    const intent = paymentIntent({ status: 'SUBMITTED', txId: txid, submittedAt: new Date(Date.now() - 20_000) });
    const linkedPurchase = purchase();
    PaymentIntent.findOne.mockResolvedValue(intent);
    ZorgaxPurchase.findOne.mockResolvedValue(linkedPurchase);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    grantPurchaseEntitlement.mockResolvedValue({ status: 'ACTIVE' });

    const result = await refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId });

    expect(result).toMatchObject({ pending: false, verified: true, plan: 'pro' });
    expect(intent.status).toBe('CONFIRMED');
    expect(linkedPurchase.status).toBe('CREDITED');
  });

  test('allows confirmation after quote expiry when the TXID was submitted in time', async () => {
    const txid = 'c'.repeat(64);
    const intent = paymentIntent({ status: 'SUBMITTED', txId: txid, submittedAt: new Date(Date.now() - 10_000), expiresAt: new Date(Date.now() - 5_000) });
    PaymentIntent.findOne.mockResolvedValue(intent);
    ZorgaxPurchase.findOne.mockResolvedValue(purchase());
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    grantPurchaseEntitlement.mockResolvedValue({ status: 'ACTIVE' });

    await expect(refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId })).resolves.toMatchObject({ verified: true });
  });
});
