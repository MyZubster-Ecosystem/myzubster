'use strict';

const { buildWorkspace, WORKSPACE_VERSION } = require('../src/services/zorgaxDigitalPilotWorkspaceService');

describe('Zorgax digital pilot workspace', () => {
  test('shows missing strategy as the current stage', () => {
    const workspace = buildWorkspace({ project: { projectId: 'p1', status: 'IDEA', validation: {}, blueprint: {}, launchOffer: {} }, snapshot: { totalEvents: 0 }, learning: { evidenceLevel: 'NONE', recommendations: [] } });
    expect(workspace.version).toBe(WORKSPACE_VERSION);
    expect(workspace.currentStage).toBe('STRATEGY');
    expect(workspace.nextActions).toContain('Define one precise target customer.');
    expect(workspace.advisoryOnly).toBe(true);
    expect(workspace.executionPerformed).toBe(false);
  });

  test('aggregates completed pilot stages and learning recommendations', () => {
    const project = { projectId: 'p2', status: 'MEASURING', targetCustomer: 'freelancers', customerProblem: 'slow workflow', valueProposition: 'faster workflow', validation: { latestReport: { verdict: 'READY_FOR_PLANNING', score: 81 } }, blueprint: { latest: { version: 'v1' } }, launchOffer: { latest: { version: 'v1' } } };
    const snapshot = { totalEvents: 12, visits: 10, sales: 2 };
    const learning = { evidenceLevel: 'DEVELOPING', recommendations: ['Keep measuring.'] };
    const workspace = buildWorkspace({ project, snapshot, learning });
    expect(workspace.progress.completedStages).toBe(6);
    expect(workspace.progress.percent).toBe(100);
    expect(workspace.currentStage).toBe('CONTINUOUS_LEARNING');
    expect(workspace.validation.verdict).toBe('READY_FOR_PLANNING');
    expect(workspace.nextActions).toContain('Keep measuring.');
    expect(workspace.predictsProfit).toBe(false);
    expect(workspace.accountingIntegrated).toBe(false);
  });
});
