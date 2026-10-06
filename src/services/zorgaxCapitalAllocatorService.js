'use strict';

const DEFAULT_WEIGHTS = Object.freeze({
  financialReturn: 0.20,
  ecosystemGrowth: 0.20,
  userGrowth: 0.10,
  developerGrowth: 0.10,
  infrastructureValue: 0.10,
  strategicValue: 0.15,
  environmentalImpact: 0.05,
  risk: -0.07,
  liquidityCost: -0.03
});

function requireSafeNonNegativeInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function requireScore(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${field} must be a number between 0 and 100`);
  }
  return value;
}

function calculateAvailableCapital({ revenueMinor, expensesMinor, obligationsMinor = 0, reserveMinor = 0 }) {
  const revenue = requireSafeNonNegativeInteger(revenueMinor, 'revenueMinor');
  const expenses = requireSafeNonNegativeInteger(expensesMinor, 'expensesMinor');
  const obligations = requireSafeNonNegativeInteger(obligationsMinor, 'obligationsMinor');
  const reserve = requireSafeNonNegativeInteger(reserveMinor, 'reserveMinor');
  return Math.max(0, revenue - expenses - obligations - reserve);
}

function calculateOpportunityScore(scores, weights = DEFAULT_WEIGHTS) {
  return Number(Object.entries(DEFAULT_WEIGHTS).reduce((total, [key]) => {
    const score = requireScore(scores[key], `scores.${key}`);
    const weight = Number(weights[key]);
    if (!Number.isFinite(weight)) throw new Error(`weights.${key} must be finite`);
    return total + (score * weight);
  }, 0).toFixed(4));
}

function rankOpportunities(opportunities, weights = DEFAULT_WEIGHTS) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    throw new Error('opportunities must contain at least one candidate');
  }

  return opportunities.map((opportunity) => ({
    ...opportunity,
    opportunityScore: calculateOpportunityScore(opportunity.scores, weights)
  })).sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function recommendAllocations({
  revenueMinor,
  expensesMinor,
  obligationsMinor = 0,
  reserveMinor = 0,
  opportunities,
  weights = DEFAULT_WEIGHTS,
  maxAllocationBps = 7000
}) {
  const availableCapitalMinor = calculateAvailableCapital({
    revenueMinor,
    expensesMinor,
    obligationsMinor,
    reserveMinor
  });

  requireSafeNonNegativeInteger(maxAllocationBps, 'maxAllocationBps');
  if (maxAllocationBps > 10000) throw new Error('maxAllocationBps cannot exceed 10000');

  if (availableCapitalMinor === 0) {
    return { availableCapitalMinor: 0, deployableCapitalMinor: 0, recommendations: [] };
  }

  const ranked = rankOpportunities(opportunities, weights);
  const deployableCapitalMinor = Math.floor((availableCapitalMinor * maxAllocationBps) / 10000);
  const positive = ranked.filter((item) => item.opportunityScore > 0);
  if (positive.length === 0 || deployableCapitalMinor === 0) {
    return { availableCapitalMinor, deployableCapitalMinor, recommendations: [] };
  }

  const scoreTotal = positive.reduce((sum, item) => sum + item.opportunityScore, 0);
  let assigned = 0;
  const recommendations = positive.map((item, index) => {
    const amountMinor = index === positive.length - 1
      ? deployableCapitalMinor - assigned
      : Math.floor(deployableCapitalMinor * (item.opportunityScore / scoreTotal));
    assigned += amountMinor;
    return {
      ...item,
      amountMinor,
      availableCapitalMinor,
      advisoryOnly: true,
      requiresHumanApproval: true
    };
  }).filter((item) => item.amountMinor > 0);

  return { availableCapitalMinor, deployableCapitalMinor, recommendations };
}

module.exports = {
  DEFAULT_WEIGHTS,
  calculateAvailableCapital,
  calculateOpportunityScore,
  rankOpportunities,
  recommendAllocations,
  requireSafeNonNegativeInteger,
  requireScore
};
