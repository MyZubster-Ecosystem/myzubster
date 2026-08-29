const crypto = require('crypto');

const {
  ZorgaxEntitlement,
  ENTITLEMENT_STATUSES,
  ENTITLEMENT_TIERS
} = require('../models/ZorgaxEntitlement');

const TIER_RANK = Object.freeze({
  FREE: 0,
  PRO: 1,
  DEVELOPER: 2
});

function requireOwnerId(ownerId) {
  const normalized = String(ownerId || '').trim();
  if (!normalized) throw new Error('ownerId is required');
  return normalized;
}

function requirePurchaseId(purchaseId) {
  const normalized = String(purchaseId || '').trim();
  if (!normalized) throw new Error('purchaseId is required');
  return normalized;
}

function normalizeTier(tier) {
  const normalized = String(tier || '').trim().toUpperCase();
  if (!Object.values(ENTITLEMENT_TIERS).includes(normalized)) {
    throw new Error('Unsupported Zorgax entitlement tier');
  }
  return normalized;
}

function requireDurationDays(durationDays) {
  const value = Number(durationDays);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 3660) {
    throw new Error('durationDays must be a positive safe integer up to 3660');
  }
  return value;
}

function publicEntitlement(entitlement) {
  const source = typeof entitlement?.toObject === 'function'
    ? entitlement.toObject()
    : entitlement;

  if (!source) return null;

  return {
    entitlementId: source.entitlementId,
    ownerId: source.ownerId,
    entitlementKey: source.entitlementKey,
    tier: source.tier,
    sourcePurchaseId: source.sourcePurchaseId,
    productId: source.productId,
    status: source.status,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
    metadata: source.metadata,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

async function expireStaleEntitlements(ownerId, now = new Date()) {
  await ZorgaxEntitlement.updateMany(
    {
      ownerId: requireOwnerId(ownerId),
      status: ENTITLEMENT_STATUSES.ACTIVE,
      endsAt: { $lte: now }
    },
    {
      $set: { status: ENTITLEMENT_STATUSES.EXPIRED }
    }
  );
}

async function grantPurchaseEntitlement({
  ownerId,
  purchaseId,
  productId,
  entitlementKey = 'zorgax.access',
  tier,
  durationDays,
  metadata = {}
}) {
  const normalizedOwnerId = requireOwnerId(ownerId);
  const normalizedPurchaseId = requirePurchaseId(purchaseId);
  const normalizedProductId = String(productId || '').trim();
  if (!normalizedProductId) throw new Error('productId is required');

  const normalizedKey = String(entitlementKey || 'zorgax.access').trim();
  if (!normalizedKey) throw new Error('entitlementKey is required');

  const normalizedTier = normalizeTier(tier);
  if (normalizedTier === ENTITLEMENT_TIERS.FREE) {
    throw new Error('Paid purchase cannot grant the FREE entitlement tier');
  }

  const normalizedDurationDays = requireDurationDays(durationDays);

  const existing = await ZorgaxEntitlement.findOne({
    sourcePurchaseId: normalizedPurchaseId
  });

  if (existing) {
    if (existing.ownerId !== normalizedOwnerId) {
      throw new Error('Purchase entitlement belongs to another owner');
    }

    return {
      replay: true,
      entitlement: publicEntitlement(existing)
    };
  }

  const now = new Date();
  await expireStaleEntitlements(normalizedOwnerId, now);

  const previous = await ZorgaxEntitlement.findOne({
    ownerId: normalizedOwnerId,
    entitlementKey: normalizedKey,
    tier: normalizedTier,
    status: ENTITLEMENT_STATUSES.ACTIVE,
    endsAt: { $gt: now }
  }).sort({ endsAt: -1 });

  const startsAt = previous && previous.endsAt > now
    ? new Date(previous.endsAt)
    : now;

  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + normalizedDurationDays);

  try {
    const entitlement = await ZorgaxEntitlement.create({
      entitlementId: `zent_${crypto.randomUUID()}`,
      ownerId: normalizedOwnerId,
      entitlementKey: normalizedKey,
      tier: normalizedTier,
      sourcePurchaseId: normalizedPurchaseId,
      productId: normalizedProductId,
      status: ENTITLEMENT_STATUSES.ACTIVE,
      startsAt,
      endsAt,
      metadata
    });

    return {
      replay: false,
      entitlement: publicEntitlement(entitlement)
    };
  } catch (error) {
    if (error?.code === 11000) {
      const replay = await ZorgaxEntitlement.findOne({
        sourcePurchaseId: normalizedPurchaseId
      });

      if (replay && replay.ownerId === normalizedOwnerId) {
        return {
          replay: true,
          entitlement: publicEntitlement(replay)
        };
      }
    }

    throw error;
  }
}

async function listEntitlements({ ownerId, includeInactive = false } = {}) {
  const normalizedOwnerId = requireOwnerId(ownerId);
  await expireStaleEntitlements(normalizedOwnerId);

  const query = { ownerId: normalizedOwnerId };
  if (!includeInactive) {
    query.status = ENTITLEMENT_STATUSES.ACTIVE;
    query.endsAt = { $gt: new Date() };
  }

  const entitlements = await ZorgaxEntitlement.find(query).sort({
    endsAt: -1,
    createdAt: -1
  });

  return entitlements.map(publicEntitlement);
}

async function getAccess(ownerId) {
  const normalizedOwnerId = requireOwnerId(ownerId);
  const active = await listEntitlements({ ownerId: normalizedOwnerId });

  const paid = active
    .filter((entry) => entry.entitlementKey === 'zorgax.access')
    .sort((a, b) => {
      const rankDiff = (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.endsAt) - new Date(a.endsAt);
    })[0];

  if (!paid) {
    return {
      ownerId: normalizedOwnerId,
      entitlementKey: 'zorgax.access',
      tier: ENTITLEMENT_TIERS.FREE,
      active: true,
      source: 'DEFAULT_FREE',
      endsAt: null
    };
  }

  return {
    ownerId: normalizedOwnerId,
    entitlementKey: paid.entitlementKey,
    tier: paid.tier,
    active: true,
    source: 'PURCHASE',
    entitlementId: paid.entitlementId,
    productId: paid.productId,
    endsAt: paid.endsAt
  };
}

module.exports = {
  ENTITLEMENT_TIERS,
  expireStaleEntitlements,
  getAccess,
  grantPurchaseEntitlement,
  listEntitlements,
  normalizeTier,
  publicEntitlement,
  requireDurationDays
};
