'use strict';

jest.mock('../src/models/ZorgaxPaymentIntent');
jest.mock('../src/models/ZorgaxSubscription');

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');
const ZorgaxSubscription = require('../src/models/ZorgaxSubscription');
const { getPaymentReceipt } = require('../src/services/zorgaxBillingService');

describe('Zorgax payment receipts', () => {
  test('builds an owner-scoped technical receipt from verified server records', async () => {
    const verifiedAt = new Date('2026-08-31T12:00:00Z');
    ZorgaxPaymentIntent.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({
      intentId: 'zorgax_receipt', ownerId: 'owner-1', plan: 'pro', asset: 'BTC', destination: 'bc1qdest',
      quote: { cryptoAmount: '0.00014728', amount: 9.9, source: 'quote-test', observedAt: verifiedAt },
      settlement: { status: 'VERIFIED', paymentReference: 'd'.repeat(64), confirmations: 1, verifiedAt, verifier: 'btc-test' },
      updatedAt: verifiedAt
    }) });
    ZorgaxSubscription.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({
      ownerId: 'owner-1', renewalOf: null,
      access: { status: 'ACTIVE', startsAt: verifiedAt, expiresAt: new Date('2026-09-30T12:00:00Z') }
    }) });

    const receipt = await getPaymentReceipt({ ownerId: 'owner-1', intentId: 'zorgax_receipt' });

    expect(ZorgaxPaymentIntent.findOne).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', 'settlement.status': 'VERIFIED' }));
    expect(receipt).toMatchObject({ documentType: 'PAYMENT_RECEIPT', fiscalInvoice: false, plan: 'pro' });
    expect(receipt.payment.paymentReference).toBe('d'.repeat(64));
    expect(receipt.access.status).toBe('ACTIVE');
  });
});
