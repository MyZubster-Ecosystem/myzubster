'use strict';

jest.mock('../src/models/ZorgaxSubscription');

const ZorgaxSubscription = require('../src/models/ZorgaxSubscription');
const { recordVerifiedPayment } = require('../src/services/zorgaxSubscriptionService');

const verification = {
  verified: true,
  verifier: 'btc-test',
  paymentReference: 'f'.repeat(64),
  confirmations: 1
};

describe('Zorgax subscription replay handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns the existing activation for a concurrent retry by the same owner', async () => {
    const existing = { _id: 'sub-1', ownerId: 'owner-1', plan: 'pro', access: { status: 'ACTIVE' } };
    ZorgaxSubscription.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(existing) });

    await expect(recordVerifiedPayment({
      ownerId: 'owner-1', planId: 'pro', asset: 'BTC', paymentReference: verification.paymentReference, verification
    })).resolves.toBe(existing);

    expect(ZorgaxSubscription.create).not.toHaveBeenCalled();
  });

  test('never lets another owner reuse the same payment reference', async () => {
    ZorgaxSubscription.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ownerId: 'owner-2' }) });

    await expect(recordVerifiedPayment({
      ownerId: 'owner-1', planId: 'pro', asset: 'BTC', paymentReference: verification.paymentReference, verification
    })).rejects.toThrow('Pagamento già utilizzato');
  });
});
