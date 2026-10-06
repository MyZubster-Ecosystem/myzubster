'use strict';

const WORKSPACE_VERSION = 'zorgax_digital_pilot_workspace_v1';

function hasObject(value) {
  return Boolean(value && typeof value === 'object' && Object.keys(value).length);
}

function buildWorkspace({ project, snapshot = null, learning = null }) {
  if (!project) throw new Error('project is required');

  const validationReport = project.validation?.latestReport || null;
  const blueprint = project.blueprint?.latest || null;
  const launchOffer = project.launchOffer?.latest || null;
  const hasMetrics = Boolean(snapshot && Number(snapshot.totalEvents || 0) > 0);

  const stages = [
    { key: 'STRATEGY', label: 'Define customer, problem and value proposition', completed: Boolean(project.targetCustomer && project.customerProblem && project.valueProposition) },
    { key: 'VALIDATION', label: 'Validate the idea with evidence', completed: Boolean(validationReport && validationReport.verdict !== 'NEEDS_EVIDENCE') },
    { key: 'BLUEPRINT', label: 'Prepare the minimum sellable product blueprint', completed: hasObject(blueprint) },
    { key: 'OFFER', label: 'Prepare launch offer and human review checklist', completed: hasObject(launchOffer) },
    { key: 'LAUNCH', label: 'Launch only after explicit human approval', completed: ['LAUNCHED', 'MEASURING'].includes(project.status) },
    { key: 'MEASUREMENT', label: 'Record real observations and learn', completed: hasMetrics }
  ];

  const firstIncomplete = stages.find((stage) => !stage.completed) || null;
  const nextActions = [];
  if (!project.targetCustomer) nextActions.push('Define one precise target customer.');
  if (!project.customerProblem) nextActions.push('Describe the concrete customer problem.');
  if (!project.valueProposition) nextActions.push('Write the value proposition in one clear sentence.');
  if (project.targetCustomer && project.customerProblem && project.valueProposition && !validationReport) nextActions.push('Run the idea validation report and collect real evidence.');
  if (validationReport?.verdict === 'NEEDS_EVIDENCE') nextActions.push('Run the proposed validation experiments and record evidence before planning the product.');
  if (validationReport && validationReport.verdict !== 'NEEDS_EVIDENCE' && !blueprint) nextActions.push('Generate and review the minimum sellable product blueprint.');
  if (blueprint && !launchOffer) nextActions.push('Generate the launch offer, landing structure, FAQ and support plan.');
  if (launchOffer && !['LAUNCHED', 'MEASURING'].includes(project.status)) nextActions.push('Complete the launch checklist and obtain explicit human approval before publication.');
  if (['LAUNCHED', 'MEASURING'].includes(project.status) && !hasMetrics) nextActions.push('Record the first real visits, leads, sales, refunds and support observations.');
  if (learning?.recommendations?.length) nextActions.push(...learning.recommendations.slice(0, 3));
  if (!nextActions.length) nextActions.push('Continue measuring one controlled change at a time and review the evidence before the next decision.');

  const completedCount = stages.filter((stage) => stage.completed).length;
  return {
    version: WORKSPACE_VERSION,
    projectId: project.projectId,
    status: project.status,
    progress: { completedStages: completedCount, totalStages: stages.length, percent: Math.round((completedCount / stages.length) * 100) },
    currentStage: firstIncomplete?.key || 'CONTINUOUS_LEARNING',
    stages: stages.map((stage) => ({ ...stage, current: firstIncomplete?.key === stage.key })),
    readiness: {
      strategyComplete: stages[0].completed,
      validationComplete: stages[1].completed,
      blueprintAvailable: stages[2].completed,
      launchOfferAvailable: stages[3].completed,
      launched: stages[4].completed,
      measurementObserved: stages[5].completed
    },
    validation: validationReport ? { verdict: validationReport.verdict, score: validationReport.score ?? null } : null,
    metrics: snapshot,
    learning: learning ? { evidenceLevel: learning.evidenceLevel, recommendations: learning.recommendations || [] } : null,
    nextActions: [...new Set(nextActions)],
    advisoryOnly: true,
    requiresHumanApproval: true,
    executionPerformed: false,
    publicationPerformed: false,
    externalMessagesSent: false,
    predictsProfit: false,
    accountingIntegrated: false
  };
}

module.exports = { WORKSPACE_VERSION, buildWorkspace };
