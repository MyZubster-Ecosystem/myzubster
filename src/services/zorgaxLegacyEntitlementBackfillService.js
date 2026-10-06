'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const {
  ZorgaxEntitlement,
  ENTITLEMENT_STATUSES
} = require('../models/ZorgaxEntitlement');
const {
  findActiveZorgaxStripeSubscription
} = require('./zorgaxStripeRecoveryService');

const LEGACY_COLLECTION = 'zorgaxsubscriptions';

function legacyProductId(plan) {
  return plan === 'developer' ? 'zorgax_developer_monthly' : 'zorgax_pro_monthly';
}

function legacyTier(plan) {
  return plan === 'developer' ? 'DEVELOPER' : 'PRO';
}

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

async function findLegacyPaidAccess(ownerId, now = new Date()) {
  const db = mongoose.connection?.db;
  if (!db) return null;

  return db.collection(LEGACY_COLLECTION).findOne(
    {
      ownerId: String(ownerId),
      plan: { $in: ['pro', 'developer'] },
      'verification.status': 'VERIFIED',
      'access.status': 'ACTIVE',
      'access.expiresAt': { $gt: now }
    },
    { sort: { 'access.expiresAt': -1 } }
  );
}

async function createRecoveredEntitlement({
  ownerId,
  plan,
  startsAt,
  endsAt,
  sourcePurchaseId,
  metadata
}) {
  const existing = await ZorgaxEntitlement.findOne({ sourcePurchaseId });
  if (existing) return existing;

  try {
    return await ZorgaxEntitlement.create({
      entitlementId: `zent_${crypto.randomUUID()}`,
      ownerId,
      entitlementKey: 'zorgax.access',
      tier: legacyTier(plan),
      sourcePurchaseId,
      productId: legacyProductId(plan),
      status: ENTITLEMENT_STATUSES.ACTIVE,
      startsAt,
      endsAt,
      metadata
    });
  } catch (error) {
    if (error?.code === 11000) {
      return ZorgaxEntitlement.findOne({ sourcePurchaseId });
    }
    throw error;
  }
}

async function backfillFromLegacyCollection(ownerId, now) {
  const legacy = await findLegacyPaidAccess(ownerId, now);
  if (!legacy) return null;

  const startsAt = validDate(legacy.access?.startsAt) || validDate(legacy.verification?.verifiedAt) || now;
  const endsAt = validDate(legacy.access?.expiresAt);
  if (!endsAt || endsAt <= now) return null;

  return createRecoveredEntitlement({
    ownerId,
    plan: legacy.plan,
    startsAt,
    endsAt,
    sourcePurchaseId: `legacy-subscription-${String(legacy._id)}`,
    metadata: {
      source: 'legacy-zorgax-subscription-backfill',
      legacySubscriptionId: String(legacy._id),
      paymentReference: legacy.paymentReference || null,
      asset: legacy.asset || null,
      migratedAt: now.toISOString()
    }
  });
}

async function backfillFromStripe(ownerId, now) {
  const stripe = await findActiveZorgaxStripeSubscription(ownerId, { now });
  if (!stripe) return null;

  return createRecoveredEntitlement({
    ownerId,
    plan: stripe.plan,
    startsAt: stripe.startsAt,
    endsAt: stripe.endsAt,
    sourcePurchaseId: `stripe-subscription-${stripe.subscriptionId}`,
    metadata: {
      source: 'stripe-subscription-backfill',
      stripeSubscriptionId: stripe.subscriptionId,
      stripeStatus: stripe.status,
      cancelAtPeriodEnd: stripe.cancelAtPeriodEnd,
      migratedAt: now.toISOString()
    }
  });
}

async function backfillLegacyEntitlement(ownerId, { now = new Date() } = {}) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('ownerId is required');

  const legacy = await backfillFromLegacyCollection(normalizedOwnerId, now);
  if (legacy) return legacy;

  return backfillFromStripe(normalizedOwnerId, now);
}

module.exports = {
  LEGACY_COLLECTION,
  backfillFromLegacyCollection,
  backfillFromStripe,
  backfillLegacyEntitlement,
  createRecoveredEntitlement,
  findLegacyPaidAccess,
  legacyProductId,
  legacyTier
};
