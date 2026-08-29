const express = require('express');

const { authenticate } = require('../middleware/auth');

const PaymentIntent = require('../models/PaymentIntent');
const {
  ZorgaxPurchase
} = require('../models/ZorgaxPurchase');

const {
  createBitcoinPaymentRail
} = require('../services/bitcoinPaymentRail');

const {
  createPaymentService
} = require('../services/paymentService');

const {
  createZorgaxMonetizationService,
  publicPurchase
} = require('../services/zorgaxMonetizationService');

const {
  getBalance,
  listLedger,
  grantPurchaseCredits
} = require('../services/zorgaxCreditService');

const {
  getAccess,
  grantPurchaseEntitlement,
  listEntitlements
} = require('../services/zorgaxEntitlementService');

const {
  listProducts,
  resolvePurchase
} = require('../services/zorgaxPricingService');

function errorStatus(error) {
  const message = String(error?.message || '');

  if (
    message.includes('not found') ||
    message.includes('not found or inactive')
  ) {
    return 404;
  }

  if (
    message.includes('disabled') ||
    message.includes('not configured') ||
    message.includes('service URL') ||
    message.includes('allocator') ||
    message.includes('verifier')
  ) {
    return 503;
  }

  if (
    message.includes('already') ||
    message.includes('does not match') ||
    message.includes('cannot') ||
    message.includes('belongs to another owner')
  ) {
    return 409;
  }

  return 400;
}

function createDefaultMonetizationService() {
  const paymentService = createPaymentService({
    rails: {
      BTC: createBitcoinPaymentRail()
    }
  });

  return createZorgaxMonetizationService({
    paymentService,
    PaymentIntentModel: PaymentIntent,
    ZorgaxPurchaseModel: ZorgaxPurchase,

    pricingService: {
      resolvePurchase
    },

    creditService: {
      grantPurchaseCredits
    },

    entitlementService: {
      grantPurchaseEntitlement
    }
  });
}

function createZorgaxMonetizationRouter({
  monetizationService = createDefaultMonetizationService(),
  authenticateMiddleware = authenticate,
  pricingService = {
    listProducts
  },
  creditService = {
    getBalance,
    listLedger
  },
  entitlementService = {
    getAccess,
    listEntitlements
  }
} = {}) {
  const router = express.Router();

  router.get(
    '/products',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const kind = req.query.kind || null;

        const products =
          await pricingService.listProducts({
            kind
          });

        return res.json({
          success: true,
          products
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.get(
    '/balance',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const balance =
          await creditService.getBalance(
            String(req.userId)
          );

        return res.json({
          success: true,
          balance
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.get(
    '/ledger',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const parsedLimit =
          req.query.limit === undefined
            ? 50
            : Number(req.query.limit);

        const entries =
          await creditService.listLedger({
            ownerId: String(req.userId),
            limit: parsedLimit,
            before: req.query.before || null
          });

        return res.json({
          success: true,
          entries
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.get(
    '/access',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const access = await entitlementService.getAccess(
          String(req.userId)
        );

        return res.json({
          success: true,
          access
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.get(
    '/entitlements',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const includeInactive =
          String(req.query.includeInactive || '').toLowerCase() === 'true';

        const entitlements = await entitlementService.listEntitlements({
          ownerId: String(req.userId),
          includeInactive
        });

        return res.json({
          success: true,
          entitlements
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.post(
    '/checkout',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const {
          productId,
          metadata = {}
        } = req.body || {};

        const result =
          await monetizationService.createCheckout({
            ownerId: String(req.userId),
            productId,
            metadata
          });

        return res.status(201).json({
          success: true,
          purchase: result.purchase,
          checkout: result.checkout
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.get(
    '/purchases/:purchaseId',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const purchase =
          await monetizationService.getPurchase({
            ownerId: String(req.userId),
            purchaseId: req.params.purchaseId
          });

        return res.json({
          success: true,
          purchase: publicPurchase(purchase)
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  router.post(
    '/purchases/:purchaseId/settle',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const minimumConfirmations =
          req.body?.minimumConfirmations === undefined
            ? 1
            : Number(req.body.minimumConfirmations);

        if (
          !Number.isSafeInteger(
            minimumConfirmations
          ) ||
          minimumConfirmations < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'minimumConfirmations must be a non-negative safe integer'
          });
        }

        const result =
          await monetizationService.settlePurchase({
            ownerId: String(req.userId),
            purchaseId: req.params.purchaseId,
            minimumConfirmations
          });

        return res.json({
          success: true,
          ...result
        });
      } catch (error) {
        return res.status(errorStatus(error)).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  return router;
}

const router = createZorgaxMonetizationRouter();

module.exports = router;
module.exports.createZorgaxMonetizationRouter =
  createZorgaxMonetizationRouter;
module.exports.errorStatus = errorStatus;
