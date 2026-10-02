'use strict';

const SUPPORTED_ASSETS = Object.freeze(['BTC']);

const PLANS = Object.freeze({
  free: Object.freeze({ id: 'free', name: 'Zorgax Free', priceEur: 0, billing: 'free', features: ['assistant-base', 'limited-research'] }),
  pro: Object.freeze({ id: 'pro', name: 'Zorgax Pro', priceEur: 9.90, billing: 'monthly-equivalent', features: ['assistant-advanced', 'web-research', 'workspace', 'priority-usage'] }),
  developer: Object.freeze({ id: 'developer', name: 'Zorgax Developer', priceEur: 29.90, billing: 'monthly-equivalent', features: ['pro', 'api-access', 'automation', 'higher-limits'] })
});

function requirePaidPlan(planId) {
  const plan = PLANS[String(planId || '').trim().toLowerCase()];
  if (!plan || plan.id === 'free') throw new Error('Piano Zorgax a pagamento non valido');
  return plan;
}

function productIdForPlan(planId) {
  return `zorgax_${requirePaidPlan(planId).id}_monthly`;
}

function entitlementForPlan(planId) {
  const plan = requirePaidPlan(planId);
  return {
    key: 'zorgax.access',
    tier: plan.id === 'developer' ? 'DEVELOPER' : 'PRO',
    durationDays: 30
  };
}

module.exports = { SUPPORTED_ASSETS, PLANS, entitlementForPlan, productIdForPlan, requirePaidPlan };
