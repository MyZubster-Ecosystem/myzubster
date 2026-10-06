'use strict';

const express = require('express');

const { authenticate, isAdmin } = require('../middleware/auth');
const PaymentIntent = require('../models/PaymentIntent');
const { ZorgaxCapitalAllocation } = require('../models/ZorgaxCapitalAllocation');
const allocatorServiceDefault = require('../services/zorgaxCapitalAllocatorService');
const decisionServiceDefault = require('../services/zorgaxCapitalDecisionService');
const learningServiceDefault = require('../services/zorgaxCapitalLearningService');
const metricsServiceDefault = require('../services/zorgaxCapitalMetricsService');
const policyServiceDefault = require('../services/zorgaxCapitalPolicyService');

const ECOSYSTEM_OWNER_ID = 'myzubster-ecosystem';

function errorStatus(error) {
  const message = String(error?.message || '');
  if (message.includes('not found')) return 404;
  if (message.includes('cannot') || message.includes('already')) return 409;
  return 400;
}

async function buildRecommendationBundle({
  req,
  PaymentIntentModel,
  AllocationModel,
  allocatorService,
  learningService,
  metricsService,
  policyService
}) {
  const asset = String(req.query.asset || 'BTC').trim().toUpperCase();
  const network = req.query.network ? String(req.query.network).trim() : null;
  const windowDays = req.query.windowDays;

  const snapshot = await metricsService.getConfirmedInflowSnapshot({
    PaymentIntentModel,
    asset,
    network,
    windowDays
  });

  const policy = policyService.getCapitalPolicy({ asset: snapshot.asset });
  const learning = await learningService.getLearningSnapshot({
    AllocationModel,
    ownerId: ECOSYSTEM_OWNER_ID
  });
  const learnedOpportunities = learningService.applyLearningToOpportunities(
    policy.opportunities,
    learning.categories
  );

  const allocation = allocatorService.recommendAllocations({
    revenueMinor: snapshot.confirmedRevenueMinor,
    expensesMinor: policy.expensesMinor,
    obligationsMinor: policy.obligationsMinor,
    reserveMinor: policy.reserveMinor,
    opportunities: learnedOpportunities,
    maxAllocationBps: policy.maxAllocationBps
  });

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    advisoryOnly: true,
    requiresHumanApproval: true,
    executionEnabled: false,
    snapshot,
    learning,
    policy: {
      expensesMinor: policy.expensesMinor,
      obligationsMinor: policy.obligationsMinor,
      reserveMinor: policy.reserveMinor,
      maxAllocationBps: policy.maxAllocationBps,
      policySource: policy.policySource,
      scoresSource: policy.scoresSource,
      learningMode: 'bounded_evidence_adjustment'
    },
    capital: {
      availableCapitalMinor: allocation.availableCapitalMinor,
      deployableCapitalMinor: allocation.deployableCapitalMinor
    },
    recommendations: allocation.recommendations
  };
}

function createZorgaxCapitalRouter({
  authenticateMiddleware = authenticate,
  adminMiddleware = isAdmin,
  PaymentIntentModel = PaymentIntent,
  AllocationModel = ZorgaxCapitalAllocation,
  allocatorService = allocatorServiceDefault,
  decisionService = decisionServiceDefault,
  learningService = learningServiceDefault,
  metricsService = metricsServiceDefault,
  policyService = policyServiceDefault
} = {}) {
  const router = express.Router();
  const adminOnly = [authenticateMiddleware, adminMiddleware];

  router.get('/recommendations', ...adminOnly, async (req, res) => {
    try {
      const bundle = await buildRecommendationBundle({
        req,
        PaymentIntentModel,
        AllocationModel,
        allocatorService,
        learningService,
        metricsService,
        policyService
      });
      return res.status(200).json(bundle);
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.get('/learning', ...adminOnly, async (_req, res) => {
    try {
      const learning = await learningService.getLearningSnapshot({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID
      });
      return res.status(200).json({
        success: true,
        advisoryOnly: true,
        learningMode: 'bounded_evidence_adjustment',
        learning
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/recommendations/record', ...adminOnly, async (req, res) => {
    try {
      const cycleReference = String(req.body?.cycleReference || '').trim();
      if (!cycleReference) throw new Error('cycleReference is required');

      const bundle = await buildRecommendationBundle({
        req,
        PaymentIntentModel,
        AllocationModel,
        allocatorService,
        learningService,
        metricsService,
        policyService
      });

      const allocations = await decisionService.recordRecommendations({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        cycleReference,
        asset: bundle.snapshot.asset,
        network: bundle.snapshot.network,
        recommendations: bundle.recommendations,
        metadata: {
          generatedAt: bundle.generatedAt,
          accountingBasis: bundle.snapshot.accountingBasis,
          windowDays: bundle.snapshot.windowDays,
          confirmedIntentCount: bundle.snapshot.confirmedIntentCount,
          confirmedRevenueMinor: bundle.snapshot.confirmedRevenueMinor,
          policy: bundle.policy,
          learning: bundle.learning
        }
      });

      return res.status(201).json({
        success: true,
        advisoryOnly: true,
        requiresHumanApproval: true,
        executionEnabled: false,
        cycleReference,
        allocations
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.get('/allocations', ...adminOnly, async (req, res) => {
    try {
      const allocations = await decisionService.listAllocations({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        status: req.query.status || null,
        limit: req.query.limit
      });
      return res.status(200).json({ success: true, allocations });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/allocations/:allocationId/approve', ...adminOnly, async (req, res) => {
    try {
      const allocation = await decisionService.approveAllocation({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        allocationId: req.params.allocationId,
        approvedBy: String(req.userId)
      });
      return res.status(200).json({ success: true, executionEnabled: false, allocation });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/allocations/:allocationId/reject', ...adminOnly, async (req, res) => {
    try {
      const allocation = await decisionService.rejectAllocation({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        allocationId: req.params.allocationId,
        rejectedBy: String(req.userId)
      });
      return res.status(200).json({ success: true, executionEnabled: false, allocation });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/allocations/:allocationId/record-spend', ...adminOnly, async (req, res) => {
    try {
      const allocation = await decisionService.recordSpend({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        allocationId: req.params.allocationId,
        spentMinor: req.body?.spentMinor,
        spendReference: req.body?.spendReference
      });
      return res.status(200).json({
        success: true,
        executionPerformed: false,
        note: 'This endpoint records an externally executed spend; it does not move funds.',
        allocation
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/allocations/:allocationId/outcome', ...adminOnly, async (req, res) => {
    try {
      const allocation = await decisionService.recordOutcome({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        allocationId: req.params.allocationId,
        measuredReturnMinor: req.body?.measuredReturnMinor,
        outcome: req.body?.outcome,
        outcomeMetrics: req.body?.outcomeMetrics || {}
      });
      return res.status(200).json({ success: true, allocation });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  return router;
}

const router = createZorgaxCapitalRouter();
router.createZorgaxCapitalRouter = createZorgaxCapitalRouter;
router.ECOSYSTEM_OWNER_ID = ECOSYSTEM_OWNER_ID;

module.exports = router;
