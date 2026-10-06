'use strict';
jest.mock('../src/models/PaymentIntent', () => ({ findOne: jest.fn() }));
jest.mock('../src/models/ZorgaxPurchase', () => ({ ZorgaxPurchase: { findOne: jest.fn() } }));
jest.mock('../src/services/zorgaxEntitlementService', () => ({ listEntitlements: jest.fn() }));
const PaymentIntent = require('../src/models/PaymentIntent');
const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { listEntitlements } = require('../src/services/zorgaxEntitlementService');
const { getPaymentReceipt } = require('../src/services/zorgaxBillingService');
test('builds an owner-scoped technical receipt from confirmed intent and credited purchase', async () => {
  const confirmedAt = new Date('2026-08-31T12:00:00Z');
  PaymentIntent.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ intentId: 'zorgax_receipt', ownerId: 'owner-1', asset: 'BTC', status: 'CONFIRMED', txId: 'd'.repeat(64), confirmedAt, metadata: { zorgax: { plan: 'pro', destination: 'bc1qdest', cryptoAmount: '0.00014728', priceEur: 9.9 } } }) });
  ZorgaxPurchase.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ownerId: 'owner-1', purchaseId: 'purchase-1', creditedAt: confirmedAt }) });
  listEntitlements.mockResolvedValue([{ sourcePurchaseId: 'purchase-1', status: 'ACTIVE', startsAt: confirmedAt, endsAt: new Date('2026-09-30T12:00:00Z') }]);
  const receipt = await getPaymentReceipt({ ownerId: 'owner-1', intentId: 'zorgax_receipt' });
  expect(PaymentIntent.findOne).toHaveBeenCalledWith({ ownerId: 'owner-1', intentId: 'zorgax_receipt', status: 'CONFIRMED', purpose: /^zorgax:/ });
  expect(ZorgaxPurchase.findOne).toHaveBeenCalledWith({ ownerId: 'owner-1', paymentIntentId: 'zorgax_receipt', status: 'CREDITED' });
  expect(receipt).toMatchObject({ documentType: 'PAYMENT_RECEIPT', fiscalInvoice: false, plan: 'pro', payment: { paymentReference: 'd'.repeat(64) }, access: { status: 'ACTIVE' } });
});
