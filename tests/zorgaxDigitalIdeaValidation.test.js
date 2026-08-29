'use strict';

const {
  VALIDATION_VERDICT,
  buildValidationReport,
  scoreIdea
} = require('../src/services/zorgaxDigitalIdeaValidationService');

function project(overrides = {}) {
  return {
    projectId: 'zdp-test',
    targetCustomer: '',
    customerProblem: '',
    valueProposition: '',
    pricing: { currency: 'EUR', amountMinor: null },
    validation: { assumptions: [], evidence: [], risks: [] },
    ...overrides
  };
}

describe('Zorgax Digital Idea Validation Engine', () => {
  test('scores an empty idea as needing evidence', () => {
    const result = scoreIdea(project());
    expect(result.score).toBe(0);
    expect(result.verdict).toBe(VALIDATION_VERDICT.NEEDS_EVIDENCE);
    expect(result.evidenceCount).toBe(0);
  });

  test('does not mark a complete-looking idea ready without recorded evidence', () => {
    const result = scoreIdea(project({
      targetCustomer: 'Independent fitness coaches',
      customerProblem: 'They lose time building weekly client plans.',
      valueProposition: 'Generate editable weekly plans faster.',
      pricing: { currency: 'EUR', amountMinor: 2900 },
      validation: {
        assumptions: ['Coaches will pay to save planning time.', 'Editable plans matter.'],
        evidence: [],
        risks: ['Generic AI tools may be sufficient.']
      }
    }));
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.verdict).toBe(VALIDATION_VERDICT.NEEDS_EVIDENCE);
  });

  test('requires multiple evidence records before ready-for-planning verdict', () => {
    const result = scoreIdea(project({
      targetCustomer: 'Independent fitness coaches',
      customerProblem: 'They lose time building weekly client plans.',
      valueProposition: 'Generate editable weekly plans faster.',
      pricing: { currency: 'EUR', amountMinor: 2900 },
      validation: {
        assumptions: ['Coaches will pay to save planning time.', 'Editable plans matter.'],
        evidence: ['Interview 1: pays for templates.', 'Interview 2: asked for editable export.', 'Preorder test produced one paid order.'],
        risks: ['Generic AI tools may be sufficient.', 'Customer acquisition cost is unknown.']
      }
    }));
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.evidenceCount).toBe(3);
    expect(result.verdict).toBe(VALIDATION_VERDICT.READY_FOR_PLANNING);
  });

  test('report clearly states it does not predict profit', () => {
    const report = buildValidationReport(project());
    expect(report.advisoryOnly).toBe(true);
    expect(report.humanApprovalRequired).toBe(true);
    expect(report.predictsProfit).toBe(false);
    expect(report.methodology.caveat).toMatch(/does not establish market demand/i);
    expect(report.recommendedExperiments.length).toBeGreaterThan(0);
  });
});
