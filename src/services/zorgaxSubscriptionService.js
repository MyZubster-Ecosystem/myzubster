'use strict';

const crypto = require('crypto');
const { ZorgaxPurchase, PURCHASE_STATUSES } = require('../models/ZorgaxPurchase');
const { getAccess: getEntitlementAccess, grantPurchaseEntitlement } = require('./zorgaxEntitlementService');
const { entitlementForPlan, productIdForPlan, requirePaidPlan } = require('./zorgaxPlanCatalog');

const ACCESS_DAYS = 30;
const SUPPORTED_PAYMENT_RAILS = new Set(['BTC', 'STRIPE']);

function normalizePaymentReference(value) {
  const ref = String(value || '').trim();
  if (!ref || ref.length > 180) throw new Error('Riferimento pagamento non valido');
  return ref;
}

function externalIntentId(reference) {
  return `zorgaxext_${crypto.createHash('sha256').update(reference).digest('hex').slice(0, 32)}`;
}

async function recordVerifiedPayment({ ownerId, planId, asset, paymentReference, verification }) {
  const plan = requirePaidPlan(planId);
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_PAYMENT_RAILS.has(normalizedAsset)) throw new Error('Asset non supportato');
  if (!verification || verification.verified !== true) throw new Error('Pagamento non verificato: accesso non attivabile');

  const ref = normalizePaymentReference(paymentReference);
  const paymentIntentId = externalIntentId(ref);
  const productId = productIdForPlan(plan.id);
  const entitlement = entitlementForPlan(plan.id);
  let purchase = await ZorgaxPurchase.findOne({ paymentIntentId });

  if (!purchase) {
    try {
      purchase = await ZorgaxPurchase.create({
        purchaseId:`zpur_ext_${crypto.randomUUID()}`,
        ownerId:String(ownerId),
        productId,
        paymentIntentId,
        creditsGranted:0,
        payment:{
          asset:normalizedAsset,
          network:normalizedAsset === 'STRIPE' ? 'stripe' : 'bitcoin',
          amountMinor: normalizedAsset === 'STRIPE'
            ? Math.round(plan.priceEur * 100)
            : (Number.isSafeInteger(verification.amountMinor) && verification.amountMinor > 0 ? verification.amountMinor : 1)
        },
        entitlement,
        status:PURCHASE_STATUSES.CREDITED,
        creditedAt:new Date(),
        metadata:{ source: normalizedAsset === 'STRIPE' ? 'stripe' : 'external-payment', paymentReference:ref, verifier:verification.verifier || null, plan:plan.id, priceEur:plan.priceEur }
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      purchase = await ZorgaxPurchase.findOne({ paymentIntentId });
      if (!purchase) throw error;
    }
  }

  if (String(purchase.ownerId) !== String(ownerId)) throw new Error('Pagamento già utilizzato');

  const granted = await grantPurchaseEntitlement({
    ownerId:String(ownerId),
    purchaseId:purchase.purchaseId,
    productId,
    entitlementKey:entitlement.key,
    tier:entitlement.tier,
    durationDays:entitlement.durationDays,
    metadata:{ paymentReference:ref, paymentAsset:normalizedAsset }
  });

  const e = granted.entitlement;
  return {
    _id: purchase._id,
    ownerId:String(ownerId),
    plan:plan.id,
    asset:normalizedAsset,
    paymentReference:ref,
    verification:{ status:'VERIFIED', verifier:verification.verifier || 'external-payment-verifier', verifiedAt:purchase.creditedAt },
    access:{ status:'ACTIVE', startsAt:e.startsAt, expiresAt:e.endsAt },
    renewalOf:null
  };
}

async function getAccess(ownerId) {
  const access = await getEntitlementAccess(String(ownerId));
  const plan = String(access.tier || 'FREE').toLowerCase();
  return {
    id:access.entitlementId || null,
    plan,
    status:access.active === false ? 'INACTIVE' : 'ACTIVE',
    startsAt:null,
    expiresAt:access.endsAt || null,
    source:access.source === 'PURCHASE' ? 'ENTITLEMENT' : access.source
  };
}

module.exports = { ACCESS_DAYS, SUPPORTED_PAYMENT_RAILS, externalIntentId, getAccess, normalizePaymentReference, recordVerifiedPayment };
