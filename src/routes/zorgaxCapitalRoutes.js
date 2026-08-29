'use strict';

const express = require('express');

const { authenticate, isAdmin } = require('../middleware/auth');
const PaymentIntent = require('../models/PaymentIntent');
const allocatorServiceDefault = require('../services/zorgaxCapitalAllocatorService');
const metricsServiceDefault = require('../services/zorgaxCapitalMetricsService');
const policyServiceDefault = require('../services/zorgaxCapitalPolicyService');

function createZorgaxCapitalRouter({
  authenticateMiddleware = authenticate,
  adminMiddleware = isAdmin,
  PaymentIntentModel = PaymentIntent,
  allocatorService = allocatorServiceDefault,
  metricsService = metricsServiceDefault,
  policyService = policyServiceDefault
} = {}) {
  const router = express.Router();

  router.get('/recommendations', authenticateMiddleware, adminMiddleware, async (req, res) => {
    try {
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
      const allocation = allocatorService.recommendAllocations({
        revenueMinor: snapshot.confirmedRevenueMinor,
        expensesMinor: policy.expensesMinor,
        obligationsMinor: policy.obligationsMinor,
        reserveMinor: policy.reserveMinor,
        opportunities: policy.opportunities,
        maxAllocationBps: policy.maxAllocationBps
      });

      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        advisoryOnly: true,
        requiresHumanApproval: true,
        executionEnabled: false,
        snapshot,
        policy: {
          expensesMinor: policy.expensesMinor,
          obligationsMinor: policy.obligationsMinor,
          reserveMinor: policy.reserveMinor,
          maxAllocationBps: policy.maxAllocationBps,
          policySource: policy.policySource,
          scoresSource: policy.scoresSource
        },
        capital: {
          availableCapitalMinor: allocation.availableCapitalMinor,
          deployableCapitalMinor: allocation.deployableCapitalMinor
        },
        recommendations: allocation.recommendations
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });

  return router;
}

const router = createZorgaxCapitalRouter();
router.createZorgaxCapitalRouter = createZorgaxCapitalRouter;

module.exports = router;
