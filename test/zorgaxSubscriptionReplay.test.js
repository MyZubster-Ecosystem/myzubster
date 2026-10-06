'use strict';
jest.mock('../src/models/ZorgaxPurchase', () => ({ ZorgaxPurchase: { findOne: jest.fn(), create: jest.fn() }, PURCHASE_STATUSES: { CREDITED: 'CREDITED' } }));
jest.mock('../src/services/zorgaxEntitlementService', () => ({ grantPurchaseEntitlement: jest.fn(), getAccess: jest.fn() }));
const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { grantPurchaseEntitlement } = require('../src/services/zorgaxEntitlementService');
const { recordVerifiedPayment } = require('../src/services/zorgaxSubscriptionService');
const verification = { verified: true, verifier: 'btc-test', paymentReference: 'f'.repeat(64), confirmations: 1 };
const input = { ownerId: 'owner-1', planId: 'pro', asset: 'BTC', paymentReference: verification.paymentReference, verification };
beforeEach(() => {
  jest.resetAllMocks();
  grantPurchaseEntitlement.mockResolvedValue({ entitlement: { startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 86400000) } });
});
test('retries the same owner purchase through idempotent entitlement granting', async () => {
  ZorgaxPurchase.findOne.mockResolvedValue({ _id: 'purchase-id', purchaseId: 'purchase-1', ownerId: 'owner-1', creditedAt: new Date() });
  await expect(recordVerifiedPayment(input)).resolves.toMatchObject({ _id: 'purchase-id', ownerId: 'owner-1', access: { status: 'ACTIVE' } });
  expect(ZorgaxPurchase.create).not.toHaveBeenCalled();
  expect(grantPurchaseEntitlement).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', purchaseId: 'purchase-1' }));
});
test('never allows another owner to reuse the payment reference', async () => {
  ZorgaxPurchase.findOne.mockResolvedValue({ ownerId: 'owner-2' });
  await expect(recordVerifiedPayment(input)).rejects.toThrow('Pagamento già utilizzato');
  expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
});
test('recovers a concurrent duplicate purchase without granting a second purchase', async () => {
  ZorgaxPurchase.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ ownerId: 'owner-1', purchaseId: 'purchase-1' });
  ZorgaxPurchase.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 11000 }));
  await expect(recordVerifiedPayment(input)).resolves.toMatchObject({ access: { status: 'ACTIVE' } });
  expect(grantPurchaseEntitlement).toHaveBeenCalledTimes(1);
});
