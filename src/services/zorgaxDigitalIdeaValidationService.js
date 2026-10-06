'use strict';

const VALIDATION_VERDICT = Object.freeze({
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  PROMISING: 'PROMISING',
  READY_FOR_PLANNING: 'READY_FOR_PLANNING'
});

const SCORE_WEIGHTS = Object.freeze({
  targetCustomer: 15,
  customerProblem: 20,
  valueProposition: 20,
  pricingHypothesis: 10,
  assumptions: 10,
  evidence: 20,
  riskAwareness: 5
});

function nonEmpty(value) {
  return Boolean(String(value || '').trim());
}

function boundedArray(value) {
  return Array.isArray(value) ? value.filter((item) => nonEmpty(item)) : [];
}

function scoreIdea(project) {
  const validation = project?.validation || {};
  const assumptions = boundedArray(validation.assumptions);
  const evidence = boundedArray(validation.evidence);
  const risks = boundedArray(validation.risks);

  const dimensions = {
    targetCustomer: nonEmpty(project?.targetCustomer) ? SCORE_WEIGHTS.targetCustomer : 0,
    customerProblem: nonEmpty(project?.customerProblem) ? SCORE_WEIGHTS.customerProblem : 0,
    valueProposition: nonEmpty(project?.valueProposition) ? SCORE_WEIGHTS.valueProposition : 0,
    pricingHypothesis: Number.isSafeInteger(project?.pricing?.amountMinor) && project.pricing.amountMinor > 0
      ? SCORE_WEIGHTS.pricingHypothesis : 0,
    assumptions: Math.min(SCORE_WEIGHTS.assumptions, assumptions.length * 5),
    evidence: Math.min(SCORE_WEIGHTS.evidence, evidence.length * 5),
    riskAwareness: Math.min(SCORE_WEIGHTS.riskAwareness, risks.length * 2.5)
  };

  const score = Math.round(Object.values(dimensions).reduce((total, value) => total + value, 0));
  const evidenceCount = evidence.length;

  let verdict = VALIDATION_VERDICT.NEEDS_EVIDENCE;
  if (score >= 75 && evidenceCount >= 3) verdict = VALIDATION_VERDICT.READY_FOR_PLANNING;
  else if (score >= 50 && evidenceCount >= 1) verdict = VALIDATION_VERDICT.PROMISING;

  return { score, verdict, dimensions, evidenceCount };
}

function buildValidationReport(project) {
  const scored = scoreIdea(project);
  const gaps = [];
  const experiments = [];

  if (!nonEmpty(project?.targetCustomer)) gaps.push('Target customer is not defined.');
  if (!nonEmpty(project?.customerProblem)) gaps.push('Customer problem is not defined.');
  if (!nonEmpty(project?.valueProposition)) gaps.push('Value proposition is not defined.');
  if (!Number.isSafeInteger(project?.pricing?.amountMinor) || project.pricing.amountMinor <= 0) {
    gaps.push('A positive price hypothesis has not been defined.');
  }
  if (boundedArray(project?.validation?.assumptions).length === 0) gaps.push('Key business assumptions have not been documented.');
  if (scored.evidenceCount === 0) gaps.push('There is no recorded customer or market evidence yet.');
  if (boundedArray(project?.validation?.risks).length === 0) gaps.push('Material risks have not been documented.');

  experiments.push(
    'Interview at least 3 prospective customers and record what problem they currently pay or spend time to solve.',
    'Show a concrete product concept or prototype and record objections instead of only asking whether people like the idea.',
    'Test the price hypothesis with a real call-to-action, preorder, waitlist or equivalent low-risk demand signal.',
    'Record negative evidence and reasons not to buy; do not keep only positive feedback.'
  );

  return {
    projectId: project.projectId,
    generatedAt: new Date().toISOString(),
    advisoryOnly: true,
    humanApprovalRequired: true,
    predictsProfit: false,
    score: scored.score,
    verdict: scored.verdict,
    scoreScale: { min: 0, max: 100 },
    dimensions: scored.dimensions,
    evidenceCount: scored.evidenceCount,
    gaps,
    recommendedExperiments: experiments,
    methodology: {
      version: 'zorgax_digital_idea_validation_v1',
      basis: 'project_completeness_and_recorded_evidence',
      weights: SCORE_WEIGHTS,
      caveat: 'This score supports product discovery decisions. It does not establish market demand or guarantee sales, profit, or product-market fit.'
    }
  };
}

module.exports = {
  SCORE_WEIGHTS,
  VALIDATION_VERDICT,
  buildValidationReport,
  scoreIdea
};
