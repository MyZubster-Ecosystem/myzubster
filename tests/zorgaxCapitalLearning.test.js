'use strict';

const {
  MAX_SCORE_ADJUSTMENT,
  MIN_COMPLETED_SAMPLES,
  adjustmentFromSummary,
  applyLearningToOpportunities,
  summarizeCompletedAllocations
} = require('../src/services/zorgaxCapitalLearningService');

function opportunity(overrides = {}) {
  return {
    id: 'security-hardening',
    category: 'SECURITY',
    title: 'Security hardening',
    scores: {
      financialReturn: 50,
      ecosystemGrowth: 70,
      userGrowth: 50,
      developerGrowth: 60,
      infrastructureValue: 80,
      strategicValue: 90,
      environmentalImpact: 20,
      risk: 33,
      liquidityCost: 12
    },
    ...overrides
  };
}

describe('Zorgax Capital Learning', () => {
  test('summarizes only completed funded outcomes', () => {
    const rows = [
      { status: 'COMPLETED', category: 'SECURITY', spentMinor: 1000, measuredReturnMinor: 1300, realizedReturnBps: 3000 },
      { status: 'COMPLETED', category: 'SECURITY', spentMinor: 1000, measuredReturnMinor: 900, realizedReturnBps: -1000 },
      { status: 'FUNDED', category: 'SECURITY', spentMinor: 1000, measuredReturnMinor: 5000, realizedReturnBps: 40000 }
    ];

    const summaries = summarizeCompletedAllocations(rows);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].completedCount).toBe(2);
    expect(summaries[0].totalSpentMinor).toBe(2000);
    expect(summaries[0].totalMeasuredReturnMinor).toBe(2200);
    expect(summaries[0].averageRealizedReturnBps).toBe(1000);
    expect(summaries[0].successRateBps).toBe(5000);
  });

  test('requires a minimum evidence sample before changing scores', () => {
    const result = adjustmentFromSummary({
      completedCount: MIN_COMPLETED_SAMPLES - 1,
      averageRealizedReturnBps: 10000,
      successRateBps: 10000
    });
    expect(result.adjustment).toBe(0);
    expect(result.evidenceLevel).toBe('insufficient');
  });

  test('bounds positive and negative learning adjustments', () => {
    const positive = adjustmentFromSummary({ completedCount: 10, averageRealizedReturnBps: 100000, successRateBps: 10000 });
    const negative = adjustmentFromSummary({ completedCount: 10, averageRealizedReturnBps: -100000, successRateBps: 0 });
    expect(positive.adjustment).toBe(MAX_SCORE_ADJUSTMENT);
    expect(negative.adjustment).toBe(-MAX_SCORE_ADJUSTMENT);
  });

  test('changes only financialReturn and preserves risk and liquidity scores', () => {
    const base = opportunity();
    const learned = applyLearningToOpportunities([base], [{
      category: 'SECURITY',
      completedCount: 5,
      averageRealizedReturnBps: 4000,
      successRateBps: 8000
    }])[0];

    expect(learned.scores.financialReturn).toBeGreaterThan(base.scores.financialReturn);
    expect(learned.scores.risk).toBe(base.scores.risk);
    expect(learned.scores.liquidityCost).toBe(base.scores.liquidityCost);
    expect(learned.scores.ecosystemGrowth).toBe(base.scores.ecosystemGrowth);
    expect(learned.learning.boundedBy).toBe(MAX_SCORE_ADJUSTMENT);
  });

  test('never pushes financialReturn outside the 0..100 score range', () => {
    const high = applyLearningToOpportunities([
      opportunity({ scores: { ...opportunity().scores, financialReturn: 99 } })
    ], [{ category: 'SECURITY', completedCount: 10, averageRealizedReturnBps: 100000, successRateBps: 10000 }])[0];

    const low = applyLearningToOpportunities([
      opportunity({ scores: { ...opportunity().scores, financialReturn: 1 } })
    ], [{ category: 'SECURITY', completedCount: 10, averageRealizedReturnBps: -100000, successRateBps: 0 }])[0];

    expect(high.scores.financialReturn).toBe(100);
    expect(low.scores.financialReturn).toBe(0);
  });
});
