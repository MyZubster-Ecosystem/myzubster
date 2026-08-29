'use strict';

const { VALIDATION_VERDICT } = require('./zorgaxDigitalIdeaValidationService');

const BLUEPRINT_VERSION = 'zorgax_digital_product_blueprint_v1';

function text(value) {
  return String(value || '').trim();
}

function requireValidatedProject(project) {
  const report = project?.validation?.latestReport;
  if (!report) throw new Error('project must be validated before generating a product blueprint');
  if (report.verdict === VALIDATION_VERDICT.NEEDS_EVIDENCE) {
    throw new Error('project needs more evidence before product planning');
  }
  return report;
}

function productTypeGuidance(productType) {
  const normalized = text(productType).toLowerCase();
  if (normalized.includes('app') || normalized.includes('software') || normalized.includes('saas')) {
    return {
      mvpShape: 'A narrowly scoped working product that solves one primary customer job end-to-end.',
      coreDeliverables: ['Core user flow', 'Minimal onboarding', 'Essential data or content layer', 'Basic support documentation']
    };
  }
  if (normalized.includes('course') || normalized.includes('corso')) {
    return {
      mvpShape: 'A concise learning outcome delivered through the minimum lessons and exercises required to achieve it.',
      coreDeliverables: ['Course outcome and syllabus', 'Core lessons', 'Practical exercises', 'Student FAQ and support guide']
    };
  }
  if (normalized.includes('ebook') || normalized.includes('guide') || normalized.includes('book')) {
    return {
      mvpShape: 'A focused guide that helps the target customer complete one valuable outcome.',
      coreDeliverables: ['Outcome-driven outline', 'Core chapters', 'Examples or worksheets', 'Delivery and support instructions']
    };
  }
  if (normalized.includes('template') || normalized.includes('prompt')) {
    return {
      mvpShape: 'A small reusable asset pack that saves the target customer measurable time or effort.',
      coreDeliverables: ['Core asset pack', 'Usage instructions', 'Worked examples', 'Version and support notes']
    };
  }
  return {
    mvpShape: 'The smallest sellable version that delivers the stated value proposition to the target customer.',
    coreDeliverables: ['Core product deliverable', 'Usage instructions', 'Customer-facing description', 'Support FAQ']
  };
}

function buildProductBlueprint(project) {
  const validationReport = requireValidatedProject(project);
  const guidance = productTypeGuidance(project.productType);
  const currency = text(project?.pricing?.currency) || 'EUR';
  const amountMinor = Number.isSafeInteger(project?.pricing?.amountMinor) ? project.pricing.amountMinor : null;

  return {
    projectId: project.projectId,
    generatedAt: new Date().toISOString(),
    version: BLUEPRINT_VERSION,
    advisoryOnly: true,
    humanApprovalRequired: true,
    executionPerformed: false,
    validationBasis: {
      score: validationReport.score,
      verdict: validationReport.verdict,
      evidenceCount: validationReport.evidenceCount,
      methodologyVersion: validationReport?.methodology?.version || null
    },
    productDefinition: {
      title: project.title,
      productType: project.productType,
      targetCustomer: project.targetCustomer,
      customerProblem: project.customerProblem,
      valueProposition: project.valueProposition,
      mvpShape: guidance.mvpShape
    },
    scope: {
      coreDeliverables: guidance.coreDeliverables,
      excludedFromFirstVersion: [
        'Features or content not required for the primary customer outcome',
        'Automation that removes required human approval',
        'Unvalidated expansion to additional customer segments'
      ]
    },
    pricingHypothesis: {
      currency,
      amountMinor,
      requiresOwnerApproval: true,
      note: 'Treat pricing as a hypothesis until tested with real demand signals.'
    },
    buildPlan: [
      { step: 1, phase: 'SCOPE', action: 'Approve the single customer outcome and freeze the first-version scope.' },
      { step: 2, phase: 'DESIGN', action: 'Create the product structure, user journey or content outline.' },
      { step: 3, phase: 'BUILD', action: 'Produce only the core deliverables required for the first sellable version.' },
      { step: 4, phase: 'QA', action: 'Review accuracy, usability, claims, rights and customer expectations.' },
      { step: 5, phase: 'OFFER', action: 'Prepare price, product description, landing-page copy, FAQ and support process.' },
      { step: 6, phase: 'APPROVAL', action: 'Require explicit owner approval before any publication or commercial launch.' }
    ],
    launchReadiness: {
      required: [
        'Product scope approved',
        'Core deliverables completed',
        'Claims reviewed for accuracy',
        'Price explicitly approved',
        'Customer support path prepared',
        'Publication explicitly approved'
      ],
      publicationAutomated: false
    },
    caveat: 'This blueprint is a planning artifact based on recorded project evidence. It does not guarantee demand, sales, profit, or product-market fit.'
  };
}

module.exports = { BLUEPRINT_VERSION, buildProductBlueprint, productTypeGuidance, requireValidatedProject };
