'use strict';

const { buildProductBlueprint, productTypeGuidance } = require('../src/services/zorgaxDigitalProductBlueprintService');

function project(overrides = {}) {
  return {
    projectId: 'zdp_test',
    title: 'Creator Toolkit',
    productType: 'course',
    targetCustomer: 'New digital creators',
    customerProblem: 'They do not know how to package a first product',
    valueProposition: 'A guided path to build a first sellable product',
    pricing: { currency: 'EUR', amountMinor: 4900 },
    validation: { latestReport: { score: 80, verdict: 'READY_FOR_PLANNING', evidenceCount: 3, methodology: { version: 'zorgax_digital_idea_validation_v1' } } },
    ...overrides
  };
}

describe('zorgaxDigitalProductBlueprintService', () => {
  test('builds a bounded advisory blueprint from a validated project', () => {
    const result = buildProductBlueprint(project());
    expect(result.version).toBe('zorgax_digital_product_blueprint_v1');
    expect(result.advisoryOnly).toBe(true);
    expect(result.executionPerformed).toBe(false);
    expect(result.validationBasis.verdict).toBe('READY_FOR_PLANNING');
    expect(result.productDefinition.targetCustomer).toBe('New digital creators');
    expect(result.pricingHypothesis.amountMinor).toBe(4900);
    expect(result.launchReadiness.publicationAutomated).toBe(false);
    expect(result.buildPlan).toHaveLength(6);
  });

  test('rejects a project that has never been validated', () => {
    expect(() => buildProductBlueprint(project({ validation: {} }))).toThrow('project must be validated');
  });

  test('rejects planning when validation still needs evidence', () => {
    const input = project({ validation: { latestReport: { score: 40, verdict: 'NEEDS_EVIDENCE', evidenceCount: 0 } } });
    expect(() => buildProductBlueprint(input)).toThrow('needs more evidence');
  });

  test('adapts MVP guidance to apps', () => {
    expect(productTypeGuidance('mobile app').coreDeliverables).toContain('Core user flow');
  });
});
