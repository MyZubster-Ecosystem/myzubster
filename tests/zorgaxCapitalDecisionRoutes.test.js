'use strict';

const express = require('express');
const request = require('supertest');
const capitalRoutes = require('../src/routes/zorgaxCapitalRoutes');

function buildApp({ role = 'admin' } = {}) {
  const authenticateMiddleware = (req, _res, next) => {
    req.userId = 'admin-1';
    req.userRole = role;
    next();
  };
  const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'admin required' });
    }
    return next();
  };

  const metricsService = {
    getConfirmedInflowSnapshot: jest.fn().mockResolvedValue({
      asset: 'BTC',
      network: 'mainnet',
      windowDays: 30,
      confirmedIntentCount: 2,
      confirmedRevenueMinor: 100000,
      accountingBasis: 'confirmed_payment_intents'
    })
  };
  const policyService = {
    getCapitalPolicy: jest.fn().mockReturnValue({
      expensesMinor: 20000,
      obligationsMinor: 10000,
      reserveMinor: 10000,
      maxAllocationBps: 5000,
      policySource: 'server_configuration',
      scoresSource: 'baseline_policy_estimates',
      opportunities: [{
        id: 'security-hardening',
        category: 'SECURITY',
        title: 'Security hardening',
        rationale: 'Reduce risk.',
        scores: {
          financialReturn: 50,
          ecosystemGrowth: 70,
          userGrowth: 50,
          developerGrowth: 60,
          infrastructureValue: 80,
          strategicValue: 90,
          environmentalImpact: 20,
          risk: 20,
          liquidityCost: 10
        }
      }]
    })
  };
  const learningService = {
    getLearningSnapshot: jest.fn().mockResolvedValue({
      categories: {},
      guardrails: {
        minimumCompletedOutcomes: 2,
        maxFinancialReturnAdjustment: 12
      }
    }),
    applyLearningToOpportunities: jest.fn((opportunities) => opportunities)
  };
  const decisionService = {
    recordRecommendations: jest.fn().mockResolvedValue([{ allocationId: 'zca-1', status: 'PROPOSED' }]),
    listAllocations: jest.fn().mockResolvedValue([{ allocationId: 'zca-1', status: 'PROPOSED' }]),
    approveAllocation: jest.fn().mockResolvedValue({ allocationId: 'zca-1', status: 'APPROVED', approvedBy: 'admin-1' }),
    rejectAllocation: jest.fn().mockResolvedValue({ allocationId: 'zca-1', status: 'REJECTED' }),
    recordSpend: jest.fn().mockResolvedValue({ allocationId: 'zca-1', status: 'FUNDED', spentMinor: 25000 }),
    recordOutcome: jest.fn().mockResolvedValue({ allocationId: 'zca-1', status: 'COMPLETED', realizedReturnBps: 2000 })
  };

  const allocatorService = require('../src/services/zorgaxCapitalAllocatorService');
  const router = capitalRoutes.createZorgaxCapitalRouter({
    authenticateMiddleware,
    adminMiddleware,
    PaymentIntentModel: {},
    AllocationModel: {},
    allocatorService,
    decisionService,
    learningService,
    metricsService,
    policyService
  });

  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/capital', router);
  return { app, decisionService, learningService };
}

describe('Zorgax Capital Decision API', () => {
  test('records server-derived recommendations as advisory proposals', async () => {
    const { app, decisionService, learningService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/capital/recommendations/record?asset=BTC&network=mainnet')
      .send({ cycleReference: '2026-08' })
      .expect(201);

    expect(response.body.executionEnabled).toBe(false);
    expect(response.body.requiresHumanApproval).toBe(true);
    expect(learningService.getLearningSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'myzubster-ecosystem'
    }));
    expect(decisionService.recordRecommendations).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'myzubster-ecosystem',
      cycleReference: '2026-08',
      asset: 'BTC'
    }));
  });

  test('lists ecosystem capital memory', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/capital/allocations')
      .expect(200);
    expect(response.body.allocations[0].allocationId).toBe('zca-1');
  });

  test('records explicit human approval without executing funds', async () => {
    const { app, decisionService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/capital/allocations/zca-1/approve')
      .send({})
      .expect(200);
    expect(response.body.executionEnabled).toBe(false);
    expect(decisionService.approveAllocation).toHaveBeenCalledWith(expect.objectContaining({
      approvedBy: 'admin-1'
    }));
  });

  test('record-spend is bookkeeping only', async () => {
    const { app, decisionService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/capital/allocations/zca-1/record-spend')
      .send({ spentMinor: 25000, spendReference: 'invoice-42' })
      .expect(200);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.note).toMatch(/does not move funds/);
    expect(decisionService.recordSpend).toHaveBeenCalledWith(expect.objectContaining({
      spentMinor: 25000,
      spendReference: 'invoice-42'
    }));
  });

  test('records measured outcomes for later learning', async () => {
    const { app, decisionService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/capital/allocations/zca-1/outcome')
      .send({
        measuredReturnMinor: 30000,
        outcome: 'Improved conversion.',
        outcomeMetrics: { conversionLiftBps: 800 }
      })
      .expect(200);
    expect(response.body.allocation.status).toBe('COMPLETED');
    expect(decisionService.recordOutcome).toHaveBeenCalledWith(expect.objectContaining({
      measuredReturnMinor: 30000,
      outcomeMetrics: { conversionLiftBps: 800 }
    }));
  });

  test('keeps all decision endpoints admin-only', async () => {
    const { app } = buildApp({ role: 'user' });
    await request(app).get('/api/zorgax/capital/allocations').expect(403);
    await request(app).post('/api/zorgax/capital/allocations/zca-1/approve').send({}).expect(403);
  });
});
