'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const {
  ZorgaxEntitlement,
  ENTITLEMENT_STATUSES
} = require('../models/ZorgaxEntitlement');

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

async function backfillLegacyEntitlement(ownerId, { now = new Date() } = {}) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('ownerId is required');

  const legacy = await findLegacyPaidAccess(normalizedOwnerId, now);
  if (!legacy) return null;

  const startsAt = validDate(legacy.access?.startsAt) || validDate(legacy.verification?.verifiedAt) || now;
  const endsAt = validDate(legacy.access?.expiresAt);
  if (!endsAt || endsAt <= now) return null;

  const sourcePurchaseId = `legacy-subscription-${String(legacy._id)}`;
  const existing = await ZorgaxEntitlement.findOne({ sourcePurchaseId });
  if (existing) return existing;

  try {
    return await ZorgaxEntitlement.create({
      entitlementId: `zent_${crypto.randomUUID()}`,
      ownerId: normalizedOwnerId,
      entitlementKey: 'zorgax.access',
      tier: legacyTier(legacy.plan),
      sourcePurchaseId,
      productId: legacyProductId(legacy.plan),
      status: ENTITLEMENT_STATUSES.ACTIVE,
      startsAt,
      endsAt,
      metadata: {
        source: 'legacy-zorgax-subscription-backfill',
        legacySubscriptionId: String(legacy._id),
        paymentReference: legacy.paymentReference || null,
        asset: legacy.asset || null,
        migratedAt: now.toISOString()
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return ZorgaxEntitlement.findOne({ sourcePurchaseId });
    }
    throw error;
  }
}

module.exports = {
  LEGACY_COLLECTION,
  backfillLegacyEntitlement,
  findLegacyPaidAccess,
  legacyProductId,
  legacyTier
};
