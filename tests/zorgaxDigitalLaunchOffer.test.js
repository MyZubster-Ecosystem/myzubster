'use strict';

const { buildLaunchOffer } = require('../src/services/zorgaxDigitalLaunchOfferService');

function project(overrides = {}) {
  return {
    projectId: 'zdp_launch',
    title: 'Creator Toolkit',
    description: 'A practical digital creator toolkit',
    productType: 'course',
    targetCustomer: 'New digital creators',
    customerProblem: 'They struggle to package a first product',
    valueProposition: 'Build a focused first digital product with a clear launch path',
    pricing: { currency: 'EUR', amountMinor: 4900 },
    blueprint: { latest: { scope: { coreDeliverables: ['Course outcome and syllabus', 'Core lessons'] } } },
    ...overrides
  };
}

describe('zorgaxDigitalLaunchOfferService', () => {
  test('builds an advisory launch package without execution', () => {
    const result = buildLaunchOffer(project());
    expect(result.version).toBe('zorgax_digital_launch_offer_v1');
    expect(result.advisoryOnly).toBe(true);
    expect(result.executionPerformed).toBe(false);
    expect(result.publicationPerformed).toBe(false);
    expect(result.externalMessagesSent).toBe(false);
    expect(result.offer.priceHypothesis.amountMinor).toBe(4900);
    expect(result.landingPage.sections.map((section) => section.key)).toContain('cta');
    expect(result.launchChecklist).toContain('Final publication explicitly approved by owner');
    expect(result.measurementPlan.metrics).toContain('conversions');
  });

  test('uses blueprint deliverables in FAQ basis', () => {
    const result = buildLaunchOffer(project());
    const included = result.faq.find((item) => item.question === 'What is included?');
    expect(included.answerBasis).toEqual(['Course outcome and syllabus', 'Core lessons']);
  });

  test('rejects launch preparation before blueprint exists', () => {
    expect(() => buildLaunchOffer(project({ blueprint: {} }))).toThrow('product blueprint is required');
  });

  test('does not create guaranteed earnings claims', () => {
    const result = buildLaunchOffer(project());
    expect(result.offer.claimsPolicy).toMatch(/Do not promise earnings/);
    expect(result.faq.find((item) => item.question === 'What results are guaranteed?').answerBasis).toMatch(/No sales, income/);
  });
});
