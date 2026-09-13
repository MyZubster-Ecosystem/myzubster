'use strict';

const {
  btcToSatoshis,
  createLegacyPurchaseBridge,
  entitlementForPlan,
  legacyProductId
} = require('../src/services/zorgaxLegacyPurchaseBridge');

function createPurchaseModel() {
  const rows = new Map();
  return {
    rows,
    async findOne(query) {
      return rows.get(query.paymentIntentId) || null;
    },
    async create(doc) {
      const row = { ...doc };
      rows.set(doc.paymentIntentId, row);
      return row;
    }
  };
}

describe('Zorgax legacy purchase bridge', () => {
  test('converts BTC decimal amounts to satoshis without floating point rounding', () => {
    expect(btcToSatoshis('0.00012345')).toBe(12345);
    expect(btcToSatoshis('1.00000001')).toBe(100000001);
  });

  test('maps legacy plans to canonical products and entitlements', () => {
    expect(legacyProductId('pro')).toBe('zorgax_pro_monthly');
    expect(legacyProductId('developer')).toBe('zorgax_developer_monthly');
    expect(entitlementForPlan('pro')).toEqual({ key: 'zorgax.access', tier: 'PRO', durationDays: 30 });
    expect(entitlementForPlan('developer')).toEqual({ key: 'zorgax.access', tier: 'DEVELOPER', durationDays: 30 });
  });

  test('records a verified legacy checkout as one idempotent unified purchase', async () => {
    const PurchaseModel = createPurchaseModel();
    const grantEntitlement = jest.fn(async (input) => ({ replay: false, entitlement: input }));
    const bridge = createLegacyPurchaseBridge({ PurchaseModel, grantEntitlement });

    const intent = {
      intentId: 'zorgax_intent_1',
      ownerId: 'user-1',
      plan: 'pro',
      asset: 'BTC',
      quote: { cryptoAmount: '0.00012345' },
      settlement: { paymentReference: 'a'.repeat(64) }
    };
    const verification = {
      verified: true,
      paymentReference: 'a'.repeat(64),
      verifier: 'btc-verifier'
    };

    const first = await bridge.recordVerifiedLegacyPurchase({ intent, verification });
    const second = await bridge.recordVerifiedLegacyPurchase({ intent, verification });

    expect(PurchaseModel.rows.size).toBe(1);
    expect(first.purchase).toMatchObject({
      purchaseId: 'zpur_legacy_zorgax_intent_1',
      productId: 'zorgax_pro_monthly',
      paymentIntentId: 'zorgax_intent_1',
      creditsGranted: 0,
      status: 'CREDITED',
      payment: { asset: 'BTC', network: 'bitcoin', amountMinor: 12345 },
      entitlement: { key: 'zorgax.access', tier: 'PRO', durationDays: 30 }
    });
    expect(second.purchase.purchaseId).toBe(first.purchase.purchaseId);
    expect(grantEntitlement).toHaveBeenCalledTimes(2);
    expect(grantEntitlement.mock.calls[0][0]).toMatchObject({
      ownerId: 'user-1',
      purchaseId: 'zpur_legacy_zorgax_intent_1',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });
  });
});
