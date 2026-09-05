const express = require('express');

const { authenticate } = require('../middleware/auth');
const PaymentIntent = require('../models/PaymentIntent');
const { createBitcoinPaymentRail } = require('../services/bitcoinPaymentRail');
const { createPaymentService } = require('../services/paymentService');

function publicIntent(intent) {
  if (!intent) return null;

  const value =
    typeof intent.toObject === 'function'
      ? intent.toObject()
      : intent;

  return {
    intentId: value.intentId,
    purpose: value.purpose,
    asset: value.asset,
    network: value.network,
    amountMinor: value.amountMinor,
    destination: value.destination,
    paymentReference: value.paymentReference,
    txId: value.txId,
    status: value.status,
    expiresAt: value.expiresAt,
    submittedAt: value.submittedAt,
    confirmedAt: value.confirmedAt,
    failureReason: value.failureReason,
    metadata: value.metadata,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function errorStatus(error) {
  const message = String(error?.message || '').toLowerCase();

  if (
    message.includes('not found') ||
    message.includes('payment intent not found')
  ) {
    return 404;
  }

  if (
    message.includes('not configured') ||
    message.includes('disabled') ||
    message.includes('service url') ||
    message.includes('allocator') ||
    message.includes('verifier')
  ) {
    return 503;
  }

  if (
    message.includes('duplicate') ||
    message.includes('already') ||
    message.includes('different transaction') ||
    message.includes('cannot be') ||
    message.includes('cannot confirm') ||
    message.includes('state ')
  ) {
    return 409;
  }

  return 400;
}

function createPaymentRouter({
  paymentService,
  PaymentIntentModel = PaymentIntent,
  authenticateMiddleware = authenticate
} = {}) {
  const router = express.Router();

  const service =
    paymentService ||
    createPaymentService({
      rails: {
        BTC: createBitcoinPaymentRail()
      }
    });

  async function findOwnedIntent(req) {
    return PaymentIntentModel.findOne({
      intentId: req.params.intentId,
      ownerId: String(req.userId)
    });
  }

  router.post('/intents', authenticateMiddleware, async (req, res) => {
    try {
      const {
        purpose,
        asset = 'BTC',
        network = 'bitcoin',
        amountMinor,
        metadata,
        ttlMs
      } = req.body || {};

      const result = await service.createCheckout({
        ownerId: String(req.userId),
        purpose,
        asset,
        network,
        amountMinor,
        metadata,
        ttlMs
      });

      return res.status(201).json({
        success: true,
        intent: publicIntent(result.intent),
        payment: result.payment
      });
    } catch (error) {
      const status = errorStatus(error);

      return res.status(status).json({
        success: false,
        message: error.message || 'Payment intent non creato'
      });
    }
  });

  router.get('/intents/:intentId', authenticateMiddleware, async (req, res) => {
    try {
      const intent = await findOwnedIntent(req);

      if (!intent) {
        return res.status(404).json({
          success: false,
          message: 'Payment intent non trovato'
        });
      }

      return res.json({
        success: true,
        intent: publicIntent(intent)
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Impossibile recuperare il payment intent'
      });
    }
  });

  router.post(
    '/intents/:intentId/transactions',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const ownedIntent = await findOwnedIntent(req);

        if (!ownedIntent) {
          return res.status(404).json({
            success: false,
            message: 'Payment intent non trovato'
          });
        }

        const { txId } = req.body || {};

        const result = await service.submitTransaction({
          intentId: ownedIntent.intentId,
          txId
        });

        return res.json({
          success: true,
          replay: Boolean(result.replay),
          intent: publicIntent(result.intent)
        });
      } catch (error) {
        const status = errorStatus(error);

        return res.status(status).json({
          success: false,
          message: error.message || 'Transazione non registrata'
        });
      }
    }
  );

  router.post(
    '/intents/:intentId/verify',
    authenticateMiddleware,
    async (req, res) => {
      try {
        const ownedIntent = await findOwnedIntent(req);

        if (!ownedIntent) {
          return res.status(404).json({
            success: false,
            message: 'Payment intent non trovato'
          });
        }

        const minimumConfirmations =
          req.body?.minimumConfirmations === undefined
            ? 1
            : req.body.minimumConfirmations;

        const result = await service.verifyAndConfirm({
          intentId: ownedIntent.intentId,
          minimumConfirmations
        });

        return res.json({
          success: true,
          replay: Boolean(result.replay),
          intent: publicIntent(result.intent)
        });
      } catch (error) {
        const status = errorStatus(error);

        return res.status(status).json({
          success: false,
          message: error.message || 'Pagamento non verificato'
        });
      }
    }
  );

  return router;
}

const router = createPaymentRouter();

module.exports = router;
module.exports.createPaymentRouter = createPaymentRouter;
module.exports.publicIntent = publicIntent;
