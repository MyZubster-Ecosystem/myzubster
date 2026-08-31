'use strict';

const {
  getAccess: getSubscriptionAccess
} = require('./zorgaxSubscriptionService');

const {
  getAccess: getEntitlementAccess
} = require('./zorgaxEntitlementService');

const {
  getSponsoredAccess
} = require('./zorgaxSponsoredAccessService');

const PLAN_RANK = Object.freeze({
  free: 0,
  pro: 1,
  developer: 2
});

const PLAN_FEATURES = Object.freeze({
  free: ['assistant-base', 'limited-research'],
  pro: ['assistant-advanced', 'web-research', 'workspace', 'priority-usage'],
  developer: ['assistant-advanced', 'web-research', 'workspace', 'priority-usage', 'api-access', 'automation', 'higher-limits']
});

function normalizePlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(PLAN_RANK, plan) ? plan : 'free';
}

function normalizeAccess(access, source) {
  const plan = normalizePlan(access?.plan || access?.tier);
  const startsAt = access?.startsAt || null;
  const expiresAt = access?.expiresAt || access?.endsAt || null;

  return {
    plan,
    tier: plan.toUpperCase(),
    status: access?.status || (access?.active === false ? 'INACTIVE' : 'ACTIVE'),
    active: access?.active !== false,
    source,
    startsAt,
    expiresAt,
    features: PLAN_FEATURES[plan]
  };
}

function guestAccess() {
  return {
    plan: 'free',
    tier: 'FREE',
    status: 'ACTIVE',
    active: true,
    source: 'GUEST',
    startsAt: null,
    expiresAt: null,
    features: PLAN_FEATURES.free
  };
}

function accessTimestamp(access) {
  const value = access?.expiresAt ? new Date(access.expiresAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function bestAccess(candidates) {
  return candidates.slice().sort((left, right) => {
    const rankDifference = PLAN_RANK[right.plan] - PLAN_RANK[left.plan];
    return rankDifference || accessTimestamp(right) - accessTimestamp(left);
  })[0] || normalizeAccess(null, 'DEFAULT_FREE');
}

async function getAccess(ownerId, {
  subscriptionAccessFn = getSubscriptionAccess,
  entitlementAccessFn = getEntitlementAccess,
  sponsoredAccessFn = getSponsoredAccess
} = {}) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('ownerId is required');

  const results = await Promise.allSettled([
    subscriptionAccessFn(normalizedOwnerId),
    entitlementAccessFn(normalizedOwnerId),
    sponsoredAccessFn(normalizedOwnerId)
  ]);

  const candidates = [];
  if (results[0].status === 'fulfilled') {
    candidates.push(normalizeAccess(results[0].value, 'SUBSCRIPTION'));
  }
  if (results[1].status === 'fulfilled') {
    candidates.push(normalizeAccess(results[1].value, 'ENTITLEMENT'));
  }
  if (results[2].status === 'fulfilled' && results[2].value) {
    candidates.push(normalizeAccess(results[2].value, 'SPONSORED_PILOT'));
  }

  if (!candidates.length) {
    throw results[0].reason || results[1].reason || results[2].reason || new Error('Zorgax access unavailable');
  }

  const selected = bestAccess(candidates.filter((entry) => entry.active));
  return {
    ownerId: normalizedOwnerId,
    ...selected,
    sourcesChecked: candidates.map((entry) => entry.source)
  };
}

function meetsPlan(access, requiredPlan) {
  return PLAN_RANK[normalizePlan(access?.plan || access?.tier)] >= PLAN_RANK[normalizePlan(requiredPlan)];
}

function getAccessPolicy(access, { authenticated = true } = {}) {
  const plan = normalizePlan(access?.plan || access?.tier);
  const rank = PLAN_RANK[plan];

  return {
    plan,
    tier: plan.toUpperCase(),
    authenticated: Boolean(authenticated),
    chat: true,
    webResearch: Boolean(authenticated),
    researchMode: !authenticated ? 'DISABLED' : plan === 'free' ? 'LIMITED' : 'FULL',
    maxWebResults: !authenticated ? 0 : plan === 'free' ? 2 : plan === 'pro' ? 5 : 8,
    workspace: rank >= PLAN_RANK.pro,
    directApi: rank >= PLAN_RANK.developer
  };
}

module.exports = {
  PLAN_FEATURES,
  PLAN_RANK,
  bestAccess,
  getAccess,
  getAccessPolicy,
  guestAccess,
  meetsPlan,
  normalizeAccess,
  normalizePlan
};
