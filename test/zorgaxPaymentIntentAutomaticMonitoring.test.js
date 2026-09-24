'use strict';

jest.mock('../src/models/PaymentIntent');
jest.mock('../src/models/ZorgaxPurchase');
jest.mock('../src/services/zorgaxEntitlementService');
jest.mock('../src/services/zorgaxChainVerifierService');

const PaymentIntent = require('../src/models/PaymentIntent');
const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { grantPurchaseEntitlement } = require('../src/services/zorgaxEntitlementService');
const { verifySettlement } = require('../src/services/zorgaxChainVerifierService');
const {
  refreshPaymentIntent,
  verifyAndActivatePaymentIntent
} = require('../src/services/zorgaxPaymentIntentService');

function paymentIntent(overrides = {}) {
  const expiresAt = new Date(Date.now() + 60_000);
  return {
    intentId: 'zorgax_monitor',
    ownerId: 'owner-1',
    purpose: 'zorgax:zorgax.pro',
    asset: 'BTC', network:'bitcoin', amountMinor:14728,
    status: 'AWAITING_PAYMENT', txId:null, submittedAt:null,
    metadata:{ zorgax:{ plan:'pro', destination:'bc1qserverdestination', cryptoAmount:'0.00014728', checkAttempts:0, ...(overrides.settlement || {}) } },
    expiresAt,
    consumedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'settlement'))
  };
}

describe('Zorgax automatic payment monitoring', () => {
  beforeEach(() => jest.clearAllMocks());

  test('persists a valid TXID when confirmations are still insufficient', async () => {
    const intent = paymentIntent();
    const txid = 'a'.repeat(64);
    PaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockRejectedValue(new Error('Conferme blockchain insufficienti'));

    const result = await verifyAndActivatePaymentIntent({
      ownerId: 'owner-1',
      intentId: intent.intentId,
      paymentReference: txid
    });

    expect(result).toMatchObject({ pending: true, automaticMonitoring: true, paymentReference: txid });
    expect(intent.submittedAt).toBeInstanceOf(Date);
    expect(intent.metadata.zorgax.nextCheckAt).toBeInstanceOf(Date);
    expect(intent.metadata.zorgax.checkAttempts).toBe(1);
    expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
  });

  test('refreshes a persisted TXID and activates access after confirmation', async () => {
    const txid = 'b'.repeat(64);
    const intent = paymentIntent({
      txId: txid,
      submittedAt: new Date(Date.now() - 20_000),
      settlement: {
        nextCheckAt: new Date(Date.now() - 1_000),
        checkAttempts: 1
      }
    });
    PaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    ZorgaxPurchase.findOne.mockResolvedValue({ purchaseId:'p1', productId:'zorgax.pro', entitlement:{ key:'zorgax.access', tier:'PRO', durationDays:30 }, save:jest.fn().mockResolvedValue(undefined) });
    grantPurchaseEntitlement.mockResolvedValue({ entitlement:{ status:'ACTIVE' } });

    const result = await refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId });

    expect(result).toMatchObject({ pending: false, verified: true, plan: 'pro' });
    expect(intent.status).toBe('CONFIRMED');
    expect(intent.confirmedAt).toBeInstanceOf(Date);
  });

  test('allows confirmation after quote expiry when the TXID was submitted in time', async () => {
    const txid = 'c'.repeat(64);
    const expiresAt = new Date(Date.now() - 5_000);
    const intent = paymentIntent({
      expiresAt,
      txId: txid,
      submittedAt: new Date(expiresAt.getTime() - 5_000),
      settlement: {
        nextCheckAt: new Date(Date.now() - 1_000),
        checkAttempts: 1
      }
    });
    PaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    ZorgaxPurchase.findOne.mockResolvedValue({ purchaseId:'p2', productId:'zorgax.pro', entitlement:{ key:'zorgax.access', tier:'PRO', durationDays:30 }, save:jest.fn().mockResolvedValue(undefined) });
    grantPurchaseEntitlement.mockResolvedValue({ entitlement:{ status:'ACTIVE' } });

    await expect(refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId }))
      .resolves.toMatchObject({ verified: true });
  });
});
