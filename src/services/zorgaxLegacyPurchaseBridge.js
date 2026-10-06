'use strict';

const { ZorgaxPurchase, PURCHASE_STATUSES } = require('../models/ZorgaxPurchase');
const { grantPurchaseEntitlement } = require('./zorgaxEntitlementService');

const SATOSHIS_PER_BTC = 100000000n;

function legacyProductId(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  if (!['pro', 'developer'].includes(normalized)) {
    throw new Error('Unsupported legacy Zorgax plan');
  }
  return `zorgax_${normalized}_monthly`;
}

function btcToSatoshis(value) {
  const raw = String(value || '').trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(raw)) {
    throw new Error('Invalid BTC amount');
  }
  const [whole, fraction = ''] = raw.split('.');
  const sats = BigInt(whole) * SATOSHIS_PER_BTC + BigInt((fraction + '00000000').slice(0, 8));
  if (sats <= 0n || sats > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('BTC amount is outside the supported range');
  }
  return Number(sats);
}

function entitlementForPlan(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  if (normalized === 'pro') return { key: 'zorgax.access', tier: 'PRO', durationDays: 30 };
  if (normalized === 'developer') return { key: 'zorgax.access', tier: 'DEVELOPER', durationDays: 30 };
  throw new Error('Unsupported legacy Zorgax plan');
}

function createLegacyPurchaseBridge({
  PurchaseModel = ZorgaxPurchase,
  grantEntitlement = grantPurchaseEntitlement
} = {}) {
  async function recordVerifiedLegacyPurchase({ intent, verification }) {
    if (!intent?.intentId || !intent?.ownerId) throw new Error('Legacy payment intent is required');
    if (!verification || verification.verified !== true) throw new Error('Verified settlement is required');

    const productId = legacyProductId(intent.plan);
    const entitlement = entitlementForPlan(intent.plan);
    const purchaseId = `zpur_legacy_${intent.intentId}`;
    const amountMinor = btcToSatoshis(intent.quote?.cryptoAmount);

    let purchase = await PurchaseModel.findOne({ paymentIntentId: intent.intentId });
    if (!purchase) {
      try {
        purchase = await PurchaseModel.create({
          purchaseId,
          ownerId: String(intent.ownerId),
          productId,
          paymentIntentId: String(intent.intentId),
          creditsGranted: 0,
          payment: {
            asset: String(intent.asset || 'BTC').toUpperCase(),
            network: String(intent.asset || '').toUpperCase() === 'BTC' ? 'bitcoin' : String(intent.asset || '').toLowerCase(),
            amountMinor
          },
          entitlement,
          status: PURCHASE_STATUSES.CREDITED,
          creditedAt: new Date(),
          metadata: {
            source: 'legacy-zorgax-checkout',
            paymentReference: verification.paymentReference || intent.settlement?.paymentReference || null,
            verifier: verification.verifier || null
          }
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        purchase = await PurchaseModel.findOne({ paymentIntentId: intent.intentId });
        if (!purchase) throw error;
      }
    }

    if (String(purchase.ownerId) !== String(intent.ownerId)) {
      throw new Error('Legacy purchase belongs to another owner');
    }

    const entitlementResult = await grantEntitlement({
      ownerId: String(intent.ownerId),
      purchaseId: purchase.purchaseId,
      productId,
      entitlementKey: entitlement.key,
      tier: entitlement.tier,
      durationDays: entitlement.durationDays,
      metadata: {
        legacyPaymentIntentId: String(intent.intentId),
        paymentReference: verification.paymentReference || intent.settlement?.paymentReference || null
      }
    });

    return { purchase, entitlement: entitlementResult };
  }

  return { recordVerifiedLegacyPurchase };
}

module.exports = {
  btcToSatoshis,
  createLegacyPurchaseBridge,
  entitlementForPlan,
  legacyProductId
};
