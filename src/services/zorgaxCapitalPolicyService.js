'use strict';

const { ALLOCATION_CATEGORIES } = require('../models/ZorgaxCapitalAllocation');
const { requireSafeNonNegativeInteger } = require('./zorgaxCapitalAllocatorService');

const DEFAULT_OPPORTUNITIES = Object.freeze([
  {
    id: 'security-hardening',
    category: ALLOCATION_CATEGORIES.SECURITY,
    title: 'Security hardening',
    rationale: 'Reduce platform, payment and agent-action risk before scaling usage.',
    scores: { financialReturn: 55, ecosystemGrowth: 72, userGrowth: 55, developerGrowth: 60, infrastructureValue: 82, strategicValue: 92, environmentalImpact: 20, risk: 20, liquidityCost: 15 }
  },
  {
    id: 'zorgax-infrastructure',
    category: ALLOCATION_CATEGORIES.INFRASTRUCTURE,
    title: 'Zorgax infrastructure',
    rationale: 'Improve reliability, capacity and unit economics for AI and knowledge workloads.',
    scores: { financialReturn: 72, ecosystemGrowth: 82, userGrowth: 70, developerGrowth: 72, infrastructureValue: 95, strategicValue: 90, environmentalImpact: 35, risk: 28, liquidityCost: 25 }
  },
  {
    id: 'developer-bounties',
    category: ALLOCATION_CATEGORIES.DEVELOPER_ECOSYSTEM,
    title: 'Developer ecosystem and bounties',
    rationale: 'Increase contribution throughput and expand reusable ecosystem capabilities.',
    scores: { financialReturn: 65, ecosystemGrowth: 90, userGrowth: 65, developerGrowth: 96, infrastructureValue: 68, strategicValue: 88, environmentalImpact: 25, risk: 35, liquidityCost: 30 }
  },
  {
    id: 'growth-experiments',
    category: ALLOCATION_CATEGORIES.GROWTH,
    title: 'Measured growth experiments',
    rationale: 'Run bounded acquisition and distribution experiments with measurable outcomes.',
    scores: { financialReturn: 74, ecosystemGrowth: 78, userGrowth: 92, developerGrowth: 50, infrastructureValue: 35, strategicValue: 70, environmentalImpact: 15, risk: 55, liquidityCost: 45 }
  },
  {
    id: 'life-environment-pilot',
    category: ALLOCATION_CATEGORIES.LIFE_ENVIRONMENT,
    title: 'LIFE and environmental pilot',
    rationale: 'Validate environmental and civic use cases that connect digital coordination to measurable physical-world impact.',
    scores: { financialReturn: 42, ecosystemGrowth: 78, userGrowth: 62, developerGrowth: 58, infrastructureValue: 55, strategicValue: 90, environmentalImpact: 100, risk: 62, liquidityCost: 55 }
  }
]);

function parseConfiguredMinor(name, fallback = 0, env = process.env) {
  const raw = env[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const parsed = Number(raw);
  return requireSafeNonNegativeInteger(parsed, name);
}

function assetPolicyKey(asset, suffix) {
  const normalized = String(asset || '').trim().toUpperCase();
  if (!/^[A-Z0-9_]{2,12}$/.test(normalized)) throw new Error('asset is invalid');
  return `ZORGAX_CAPITAL_${normalized}_${suffix}`;
}

function getCapitalPolicy({ asset, env = process.env } = {}) {
  const maxAllocationBps = parseConfiguredMinor(assetPolicyKey(asset, 'MAX_ALLOCATION_BPS'), 7000, env);
  if (maxAllocationBps > 10000) throw new Error('maxAllocationBps cannot exceed 10000');

  return {
    expensesMinor: parseConfiguredMinor(assetPolicyKey(asset, 'EXPENSES_MINOR'), 0, env),
    obligationsMinor: parseConfiguredMinor(assetPolicyKey(asset, 'OBLIGATIONS_MINOR'), 0, env),
    reserveMinor: parseConfiguredMinor(assetPolicyKey(asset, 'RESERVE_MINOR'), 0, env),
    maxAllocationBps,
    opportunities: DEFAULT_OPPORTUNITIES.map((item) => ({ ...item, scores: { ...item.scores } })),
    policySource: 'server_configuration',
    scoresSource: 'baseline_policy_estimates'
  };
}

module.exports = {
  DEFAULT_OPPORTUNITIES,
  assetPolicyKey,
  getCapitalPolicy,
  parseConfiguredMinor
};
