'use strict';

const express = require('express');
const request = require('supertest');
const capitalRoutes = require('../src/routes/zorgaxCapitalRoutes');

function buildApp({ role = 'admin' } = {}) {
  const authenticateMiddleware = (req, _res, next) => {
    req.userId = 'owner-1';
    req.userRole = role;
    next();
  };
  const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'admin required' });
    }
    return next();
  };

  const treasuryService = {
    getTreasurySnapshot: jest.fn().mockResolvedValue({
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      recognizedRevenueMinor: 100000,
      recognizedExpensesMinor: 20000,
      recognizedProfitMinor: 80000,
      outstandingLiabilitiesMinor: 10000,
      treasuryBalanceMinor: 80000,
      reserveMinor: 10000,
      capitalBeforeReserveMinor: 70000,
      investableCapitalMinor: 60000,
      accountingBasis: 'zorgax_economic_ledger_v1',
      caveat: 'operational accounting only'
    })
  };

  const learningService = {
    getLearningSnapshot: jest.fn().mockResolvedValue({
      asset: 'BTC',
      network: 'mainnet',
      completedAllocationCount: 2,
      categories: [{
        category: 'SECURITY',
        completedCount: 2,
        successfulCount: 2,
        totalSpentMinor: 20000,
        totalMeasuredReturnMinor: 26000,
        totalRealizedReturnBps: 6000,
        averageRealizedReturnBps: 3000,
        successRateBps: 10000
      }],
      guardrails: {
        maxFinancialReturnScoreAdjustment: 12,
        minimumSamplesBeforeAdjustment: 2,
        modifiesRiskScore: false,
        modifiesReserve: false,
        modifiesMaxAllocation: false,
        isolatesAsset: true,
        isolatesNetworkWhenSpecified: true
      }
    }),
    applyLearningToOpportunities: jest.fn((opportunities) => opportunities.map((item) => ({
      ...item,
      learning: {
        applied: false,
        financialReturnAdjustment: 0,
        evidenceLevel: 'limited',
        completedCount: 2,
        boundedBy: 12
      }
    })))
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

  const allocatorService = require('../src/services/zorgaxCapitalAllocatorService');
  const router = capitalRoutes.createZorgaxCapitalRouter({
    authenticateMiddleware,
    adminMiddleware,
    AllocationModel: {},
    LedgerModel: {},
    learningService,
    policyService,
    treasuryService,
    allocatorService
  });

  const app = express();
  app.use('/api/zorgax/capital', router);
  return { app, treasuryService, learningService, policyService };
}

describe('Zorgax Capital API', () => {
  test('returns admin-only advisory recommendations from investable treasury capital', async () => {
    const { app, treasuryService, learningService } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/capital/recommendations?asset=BTC&network=mainnet')
      .expect(200);

    expect(response.body.advisoryOnly).toBe(true);
    expect(response.body.requiresHumanApproval).toBe(true);
    expect(response.body.executionEnabled).toBe(false);
    expect(response.body.snapshot.accountingBasis).toBe('zorgax_economic_ledger_v1');
    expect(response.body.snapshot.investableCapitalMinor).toBe(60000);
    expect(response.body.capital.availableCapitalMinor).toBe(60000);
    expect(response.body.capital.deployableCapitalMinor).toBe(30000);
    expect(response.body.policy.accountingMode).toBe('zorgax_economic_ledger_v1');
    expect(response.body.learning.guardrails.isolatesAsset).toBe(true);
    expect(response.body.recommendations).toHaveLength(1);
    expect(response.body.recommendations[0].amountMinor).toBe(30000);
    expect(treasuryService.getTreasurySnapshot).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet',
      reserveMinor: 10000
    }));
    expect(learningService.getLearningSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet'
    }));
  });

  test('exposes asset/network-isolated learning evidence without enabling execution', async () => {
    const { app, learningService } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/capital/learning?asset=BTC&network=mainnet')
      .expect(200);

    expect(response.body.advisoryOnly).toBe(true);
    expect(response.body.learningMode).toBe('bounded_evidence_adjustment');
    expect(response.body.learning.completedAllocationCount).toBe(2);
    expect(response.body.learning.guardrails.maxFinancialReturnScoreAdjustment).toBe(12);
    expect(learningService.getLearningSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet'
    }));
  });

  test('rejects non-admin callers', async () => {
    const { app } = buildApp({ role: 'user' });
    await request(app)
      .get('/api/zorgax/capital/recommendations')
      .expect(403);
  });

  test('does not expose any spending action', async () => {
    const { app } = buildApp();
    await request(app)
      .post('/api/zorgax/capital/recommendations')
      .expect(404);
  });
});
