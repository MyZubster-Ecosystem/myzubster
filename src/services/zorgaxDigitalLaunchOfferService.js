'use strict';

const LAUNCH_OFFER_VERSION = 'zorgax_digital_launch_offer_v1';

function text(value) {
  return String(value || '').trim();
}

function requireBlueprint(project) {
  const blueprint = project?.blueprint?.latest;
  if (!blueprint) throw new Error('product blueprint is required before launch offer generation');
  return blueprint;
}

function formatPrice(pricing) {
  if (!Number.isSafeInteger(pricing?.amountMinor) || pricing.amountMinor < 0) return null;
  const currency = text(pricing.currency) || 'EUR';
  return { currency, amountMinor: pricing.amountMinor };
}

function buildLaunchOffer(project) {
  const blueprint = requireBlueprint(project);
  const targetCustomer = text(project.targetCustomer);
  const customerProblem = text(project.customerProblem);
  const valueProposition = text(project.valueProposition);
  const price = formatPrice(project.pricing);

  return {
    projectId: project.projectId,
    generatedAt: new Date().toISOString(),
    version: LAUNCH_OFFER_VERSION,
    advisoryOnly: true,
    humanApprovalRequired: true,
    executionPerformed: false,
    publicationPerformed: false,
    externalMessagesSent: false,
    offer: {
      productName: project.title,
      audience: targetCustomer,
      problem: customerProblem,
      promisedOutcomeDraft: valueProposition,
      priceHypothesis: price,
      positioningStatement: `${project.title} is designed for ${targetCustomer || 'the defined target customer'} who need help with ${customerProblem || 'the validated problem'}, by providing ${valueProposition || 'the defined value proposition'}.`,
      claimsPolicy: 'Use only claims supported by the product and available evidence. Do not promise earnings, guaranteed outcomes, or unsupported performance.'
    },
    landingPage: {
      sections: [
        { key: 'hero', purpose: 'State the target customer, problem and product outcome clearly.' },
        { key: 'problem', purpose: 'Describe the customer problem using accurate, non-manipulative language.' },
        { key: 'solution', purpose: 'Explain what the product includes and how it addresses the problem.' },
        { key: 'deliverables', purpose: 'List the concrete deliverables from the approved blueprint.' },
        { key: 'evidence', purpose: 'Show only real evidence, examples or testimonials the owner is authorized to publish.' },
        { key: 'price', purpose: 'Present the owner-approved price and what is included.' },
        { key: 'faq', purpose: 'Set expectations, limitations, support terms and who the product is not for.' },
        { key: 'cta', purpose: 'Use a clear call-to-action without false urgency or guaranteed-result claims.' }
      ],
      draftHero: {
        headline: valueProposition || project.title,
        subheadline: targetCustomer && customerProblem ? `For ${targetCustomer} who want a practical way to address ${customerProblem}.` : project.description,
        cta: 'Review the offer and choose the appropriate next step.'
      }
    },
    faq: [
      { question: 'Who is this product for?', answerBasis: targetCustomer || 'Define the target customer before launch.' },
      { question: 'What problem does it address?', answerBasis: customerProblem || 'Define the customer problem before launch.' },
      { question: 'What is included?', answerBasis: blueprint?.scope?.coreDeliverables || [] },
      { question: 'What results are guaranteed?', answerBasis: 'No sales, income, performance or outcome is guaranteed.' },
      { question: 'How is support handled?', answerBasis: 'Define response channel, scope, hours and escalation before publication.' }
    ],
    supportPlan: {
      requiredBeforeLaunch: true,
      components: [
        'Approved product knowledge base',
        'Customer contact channel',
        'Expected response window',
        'Refund or cancellation policy when applicable',
        'Escalation path for issues Zorgax should not answer autonomously'
      ],
      aiSupportRule: 'AI support must be grounded in approved product information and escalate uncertainty instead of inventing answers.'
    },
    launchChecklist: [
      'Core product deliverables completed and reviewed',
      'Offer and positioning approved by owner',
      'Price explicitly approved by owner',
      'Landing-page claims checked against evidence',
      'Rights and permissions for assets/testimonials verified',
      'FAQ and support process approved',
      'Refund/cancellation terms reviewed where applicable',
      'Tracking plan for visits, conversions, sales, refunds and support load prepared',
      'Publication channel selected by owner',
      'Final publication explicitly approved by owner'
    ],
    measurementPlan: {
      metrics: ['visits', 'qualified_leads', 'conversions', 'units_sold', 'gross_revenue', 'refunds', 'support_requests'],
      interpretation: 'Use observed funnel and customer evidence to improve the offer. Do not infer product-market fit from a single sale or a small sample.'
    },
    caveat: 'This launch package is a draft planning artifact. Human review is required before publication, pricing changes, customer communication, or commercial execution.'
  };
}

module.exports = { LAUNCH_OFFER_VERSION, buildLaunchOffer, formatPrice, requireBlueprint };
