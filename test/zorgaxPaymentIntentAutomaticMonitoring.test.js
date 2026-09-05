'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/services/zorgaxChainVerifierService');
jest.mock('../src/services/zorgaxSubscriptionService');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const { verifySettlement } = require('../src/services/zorgaxChainVerifierService');
const { recordVerifiedPayment } = require('../src/services/zorgaxSubscriptionService');
const {
  refreshPaymentIntent,
  verifyAndActivatePaymentIntent
} = require('../src/services/zorgaxPaymentIntentService');

function paymentIntent(overrides = {}) {
  const expiresAt = new Date(Date.now() + 60_000);
  return {
    intentId: 'zorgax_monitor',
    ownerId: 'owner-1',
    plan: 'pro',
    asset: 'BTC',
    destination: 'bc1qserverdestination',
    quote: { cryptoAmount: '0.00014728' },
    settlement: {
      status: 'PENDING',
      paymentReference: null,
      submittedAt: null,
      nextCheckAt: null,
      checkAttempts: 0,
      ...overrides.settlement
    },
    renewalOf: null,
    expiresAt,
    consumedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

describe('Zorgax automatic payment monitoring', () => {
  beforeEach(() => jest.clearAllMocks());

  test('persists a valid TXID when confirmations are still insufficient', async () => {
    const intent = paymentIntent();
    const txid = 'a'.repeat(64);
    ZorgaxPaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockRejectedValue(new Error('Conferme blockchain insufficienti'));

    const result = await verifyAndActivatePaymentIntent({
      ownerId: 'owner-1',
      intentId: intent.intentId,
      paymentReference: txid
    });

    expect(result).toMatchObject({ pending: true, automaticMonitoring: true, paymentReference: txid });
    expect(intent.settlement.submittedAt).toBeInstanceOf(Date);
    expect(intent.settlement.nextCheckAt).toBeInstanceOf(Date);
    expect(intent.settlement.checkAttempts).toBe(1);
    expect(recordVerifiedPayment).not.toHaveBeenCalled();
  });

  test('refreshes a persisted TXID and activates access after confirmation', async () => {
    const txid = 'b'.repeat(64);
    const intent = paymentIntent({
      settlement: {
        status: 'PENDING',
        paymentReference: txid,
        submittedAt: new Date(Date.now() - 20_000),
        nextCheckAt: new Date(Date.now() - 1_000),
        checkAttempts: 1
      }
    });
    ZorgaxPaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    recordVerifiedPayment.mockResolvedValue({ _id: 'sub-1', plan: 'pro', access: { status: 'ACTIVE' } });

    const result = await refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId });

    expect(result).toMatchObject({ pending: false, verified: true, plan: 'pro' });
    expect(intent.settlement.status).toBe('VERIFIED');
    expect(intent.consumedAt).toBeInstanceOf(Date);
  });

  test('allows confirmation after quote expiry when the TXID was submitted in time', async () => {
    const txid = 'c'.repeat(64);
    const expiresAt = new Date(Date.now() - 5_000);
    const intent = paymentIntent({
      expiresAt,
      settlement: {
        status: 'PENDING',
        paymentReference: txid,
        submittedAt: new Date(expiresAt.getTime() - 5_000),
        nextCheckAt: new Date(Date.now() - 1_000),
        checkAttempts: 1
      }
    });
    ZorgaxPaymentIntent.findOne.mockResolvedValue(intent);
    verifySettlement.mockResolvedValue({ verified: true, paymentReference: txid, verifier: 'btc-test', confirmations: 1 });
    recordVerifiedPayment.mockResolvedValue({ _id: 'sub-2', plan: 'pro', access: { status: 'ACTIVE' } });

    await expect(refreshPaymentIntent({ ownerId: 'owner-1', intentId: intent.intentId }))
      .resolves.toMatchObject({ verified: true });
  });
});
