'use strict';

const {
  calculateAvailableCapital,
  calculateOpportunityScore,
  rankOpportunities,
  recommendAllocations
} = require('../src/services/zorgaxCapitalAllocatorService');

const baseScores = {
  financialReturn: 70,
  ecosystemGrowth: 80,
  userGrowth: 60,
  developerGrowth: 50,
  infrastructureValue: 70,
  strategicValue: 80,
  environmentalImpact: 40,
  risk: 20,
  liquidityCost: 10
};

describe('Zorgax Capital Allocator', () => {
  test('calculates capital only after expenses, obligations and reserve', () => {
    expect(calculateAvailableCapital({
      revenueMinor: 100000,
      expensesMinor: 30000,
      obligationsMinor: 10000,
      reserveMinor: 20000
    })).toBe(40000);
  });

  test('never reports negative available capital', () => {
    expect(calculateAvailableCapital({
      revenueMinor: 10000,
      expensesMinor: 12000,
      obligationsMinor: 1000,
      reserveMinor: 1000
    })).toBe(0);
  });

  test('penalizes risk in opportunity scoring', () => {
    const safer = calculateOpportunityScore({ ...baseScores, risk: 10 });
    const riskier = calculateOpportunityScore({ ...baseScores, risk: 90 });
    expect(safer).toBeGreaterThan(riskier);
  });

  test('ranks stronger opportunities first', () => {
    const ranked = rankOpportunities([
      { id: 'weak', scores: { ...baseScores, ecosystemGrowth: 20 } },
      { id: 'strong', scores: { ...baseScores, ecosystemGrowth: 95 } }
    ]);
    expect(ranked[0].id).toBe('strong');
  });

  test('keeps recommendations advisory-only and below deployable capital', () => {
    const result = recommendAllocations({
      revenueMinor: 100000,
      expensesMinor: 20000,
      reserveMinor: 20000,
      opportunities: [
        { id: 'security', category: 'SECURITY', scores: baseScores },
        {
          id: 'developers',
          category: 'DEVELOPER_ECOSYSTEM',
          scores: { ...baseScores, developerGrowth: 95 }
        }
      ]
    });

    expect(result.availableCapitalMinor).toBe(60000);
    expect(result.deployableCapitalMinor).toBe(42000);
    expect(result.recommendations.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(42000);
    for (const recommendation of result.recommendations) {
      expect(recommendation.advisoryOnly).toBe(true);
      expect(recommendation.requiresHumanApproval).toBe(true);
    }
  });

  test('does not recommend spending when no capital is available', () => {
    const result = recommendAllocations({
      revenueMinor: 10000,
      expensesMinor: 10000,
      opportunities: [{ id: 'growth', scores: baseScores }]
    });
    expect(result.recommendations).toEqual([]);
  });
});
