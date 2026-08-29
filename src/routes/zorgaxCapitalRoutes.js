'use strict';

const express = require('express');

const { authenticate, isAdmin } = require('../middleware/auth');
const { ZorgaxCapitalAllocation } = require('../models/ZorgaxCapitalAllocation');
const { ZorgaxEconomicLedgerEntry } = require('../models/ZorgaxEconomicLedgerEntry');
const allocatorServiceDefault = require('../services/zorgaxCapitalAllocatorService');
const decisionServiceDefault = require('../services/zorgaxCapitalDecisionService');
const learningServiceDefault = require('../services/zorgaxCapitalLearningService');
const policyServiceDefault = require('../services/zorgaxCapitalPolicyService');
const treasuryServiceDefault = require('../services/zorgaxTreasuryService');

const ECOSYSTEM_OWNER_ID = 'myzubster-ecosystem';

function errorStatus(error) {
  const message = String(error?.message || '');
  if (message.includes('not found')) return 404;
  if (message.includes('cannot') || message.includes('already')) return 409;
  return 400;
}

async function buildRecommendationBundle({
  req,
  AllocationModel,
  LedgerModel,
  allocatorService,
  learningService,
  policyService,
  treasuryService
}) {
  const asset = String(req.query.asset || 'BTC').trim().toUpperCase();
  const network = req.query.network ? String(req.query.network).trim() : null;

  const policy = policyService.getCapitalPolicy({ asset });
  const snapshot = await treasuryService.getTreasurySnapshot({
    LedgerModel,
    ownerId: ECOSYSTEM_OWNER_ID,
    asset,
    network,
    reserveMinor: policy.reserveMinor
  });

  const learning = await learningService.getLearningSnapshot({
    AllocationModel,
    ownerId: ECOSYSTEM_OWNER_ID,
    asset: snapshot.asset,
    network: snapshot.network
  });
  const learnedOpportunities = learningService.applyLearningToOpportunities(
    policy.opportunities,
    learning.categories
  );

  /*
   * The allocator still owns ranking and max-allocation math, but accounting
   * constraints have already been applied by the treasury snapshot. Feeding
   * investableCapitalMinor as the allocator's available base prevents policy
   * expenses/obligations/reserve from being subtracted twice.
   */
  const allocation = allocatorService.recommendAllocations({
    revenueMinor: snapshot.investableCapitalMinor,
    expensesMinor: 0,
    obligationsMinor: 0,
    reserveMinor: 0,
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
      reserveMinor: policy.reserveMinor,
      maxAllocationBps: policy.maxAllocationBps,
      policySource: policy.policySource,
      scoresSource: policy.scoresSource,
      learningMode: 'bounded_evidence_adjustment',
      accountingMode: 'zorgax_economic_ledger_v1'
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
  AllocationModel = ZorgaxCapitalAllocation,
  LedgerModel = ZorgaxEconomicLedgerEntry,
  allocatorService = allocatorServiceDefault,
  decisionService = decisionServiceDefault,
  learningService = learningServiceDefault,
  policyService = policyServiceDefault,
  treasuryService = treasuryServiceDefault
} = {}) {
  const router = express.Router();
  const adminOnly = [authenticateMiddleware, adminMiddleware];

  router.get('/recommendations', ...adminOnly, async (req, res) => {
    try {
      const bundle = await buildRecommendationBundle({
        req,
        AllocationModel,
        LedgerModel,
        allocatorService,
        learningService,
        policyService,
        treasuryService
      });
      return res.status(200).json(bundle);
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.get('/learning', ...adminOnly, async (req, res) => {
    try {
      const asset = String(req.query.asset || 'BTC').trim().toUpperCase();
      const network = req.query.network ? String(req.query.network).trim() : null;
      const learning = await learningService.getLearningSnapshot({
        AllocationModel,
        ownerId: ECOSYSTEM_OWNER_ID,
        asset,
        network
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
        AllocationModel,
        LedgerModel,
        allocatorService,
        learningService,
        policyService,
        treasuryService
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
          recognizedRevenueMinor: bundle.snapshot.recognizedRevenueMinor,
          recognizedExpensesMinor: bundle.snapshot.recognizedExpensesMinor,
          recognizedProfitMinor: bundle.snapshot.recognizedProfitMinor,
          outstandingLiabilitiesMinor: bundle.snapshot.outstandingLiabilitiesMinor,
          treasuryBalanceMinor: bundle.snapshot.treasuryBalanceMinor,
          investableCapitalMinor: bundle.snapshot.investableCapitalMinor,
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
