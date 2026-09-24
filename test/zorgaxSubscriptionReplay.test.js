'use strict';

jest.mock('../src/models/ZorgaxPurchase');
jest.mock('../src/services/zorgaxEntitlementService');

const { ZorgaxPurchase } = require('../src/models/ZorgaxPurchase');
const { grantPurchaseEntitlement } = require('../src/services/zorgaxEntitlementService');
const { recordVerifiedPayment } = require('../src/services/zorgaxSubscriptionService');

const verification={ verified:true, verifier:'btc-test', paymentReference:'f'.repeat(64), confirmations:1 };

describe('Zorgax subscription replay handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns access for a retry by the same owner without creating another purchase', async () => {
    ZorgaxPurchase.findOne.mockResolvedValue({ _id:'p1', purchaseId:'purchase-1', ownerId:'owner-1', productId:'zorgax.pro', creditedAt:new Date() });
    grantPurchaseEntitlement.mockResolvedValue({ entitlement:{ startsAt:new Date(), endsAt:new Date(Date.now()+86400000) } });

    const result=await recordVerifiedPayment({ ownerId:'owner-1', planId:'pro', asset:'BTC', paymentReference:verification.paymentReference, verification });

    expect(ZorgaxPurchase.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ownerId:'owner-1', plan:'pro', access:{ status:'ACTIVE' } });
    expect(grantPurchaseEntitlement).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1', purchaseId:'purchase-1' }));
  });

  test('never lets another owner reuse the same payment reference', async () => {
    ZorgaxPurchase.findOne.mockResolvedValue({ purchaseId:'purchase-2', ownerId:'owner-2' });

    await expect(recordVerifiedPayment({ ownerId:'owner-1', planId:'pro', asset:'BTC', paymentReference:verification.paymentReference, verification }))
      .rejects.toThrow('Pagamento già utilizzato');
    expect(grantPurchaseEntitlement).not.toHaveBeenCalled();
  });
});
