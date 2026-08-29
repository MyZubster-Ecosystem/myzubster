'use strict';

const express = require('express');

const { authenticate, isAdmin } = require('../middleware/auth');
const PaymentIntent = require('../models/PaymentIntent');
const { ZorgaxEconomicLedgerEntry } = require('../models/ZorgaxEconomicLedgerEntry');
const ingestionServiceDefault = require('../services/zorgaxAccountingIngestionService');
const treasuryServiceDefault = require('../services/zorgaxTreasuryService');
const policyServiceDefault = require('../services/zorgaxCapitalPolicyService');

const { ECOSYSTEM_OWNER_ID } = ingestionServiceDefault;

function errorStatus(error) {
  const message = String(error?.message || '');
  if (message.includes('not found')) return 404;
  if (message.includes('already') || message.includes('different accounting data')) return 409;
  return 400;
}

function createZorgaxAccountingRouter({
  authenticateMiddleware = authenticate,
  adminMiddleware = isAdmin,
  PaymentIntentModel = PaymentIntent,
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ingestionService = ingestionServiceDefault,
  treasuryService = treasuryServiceDefault,
  policyService = policyServiceDefault
} = {}) {
  const router = express.Router();
  const adminOnly = [authenticateMiddleware, adminMiddleware];

  router.post('/sync-confirmed-payments', ...adminOnly, async (req, res) => {
    try {
      const asset = String(req.body?.asset || 'BTC').trim().toUpperCase();
      const network = req.body?.network ? String(req.body.network).trim() : null;
      const windowDays = req.body?.windowDays;

      const result = await ingestionService.syncConfirmedPaymentIntents({
        PaymentIntentModel,
        LedgerModel,
        asset,
        network,
        windowDays,
        ecosystemOwnerId: ECOSYSTEM_OWNER_ID
      });

      return res.status(200).json({
        success: true,
        executionPerformed: false,
        accountingWritePerformed: true,
        result
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.post('/recognize-payment/:intentId', ...adminOnly, async (req, res) => {
    try {
      const entry = await ingestionService.recognizeConfirmedPaymentIntent({
        PaymentIntentModel,
        LedgerModel,
        intentId: req.params.intentId,
        ecosystemOwnerId: ECOSYSTEM_OWNER_ID
      });
      return res.status(200).json({
        success: true,
        executionPerformed: false,
        accountingWritePerformed: true,
        entry
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  router.get('/treasury', ...adminOnly, async (req, res) => {
    try {
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

      return res.status(200).json({
        success: true,
        advisoryOnly: true,
        executionEnabled: false,
        snapshot,
        policy: {
          reserveMinor: policy.reserveMinor,
          maxAllocationBps: policy.maxAllocationBps,
          policySource: policy.policySource
        }
      });
    } catch (error) {
      return res.status(errorStatus(error)).json({ success: false, message: error.message });
    }
  });

  return router;
}

const router = createZorgaxAccountingRouter();
router.createZorgaxAccountingRouter = createZorgaxAccountingRouter;
router.ECOSYSTEM_OWNER_ID = ECOSYSTEM_OWNER_ID;

module.exports = router;
