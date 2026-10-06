const PaymentIntent = require('../models/PaymentIntent');

const {
  allocateDestination,
  confirmPaymentIntent,
  createPaymentIntent,
  recordTransaction
} = require('./paymentIntentService');

function createPaymentService({
  rails = {}
} = {}) {
  function getRail(asset) {
    const normalizedAsset = String(asset || '')
      .trim()
      .toUpperCase();

    if (!normalizedAsset) {
      throw new Error('payment asset is required');
    }

    const rail = rails[normalizedAsset];

    if (!rail) {
      throw new Error(
        `payment rail not configured for ${normalizedAsset}`
      );
    }

    return rail;
  }

  async function createCheckout({
    ownerId,
    purpose,
    asset,
    network,
    amountMinor,
    metadata,
    ttlMs
  }) {
    const intent = await createPaymentIntent({
      ownerId,
      purpose,
      asset,
      network,
      amountMinor,
      metadata,
      ttlMs
    });

    const rail = getRail(intent.asset);

    const allocation = await rail.allocate({
      intentId: intent.intentId,
      paymentReference: intent.paymentReference,
      network: intent.network,
      amountMinor: intent.amountMinor
    });

    const allocatedIntent = await allocateDestination({
      intentId: intent.intentId,
      destination: allocation.destination
    });

    return {
      intent: allocatedIntent,
      payment: {
        asset: allocatedIntent.asset,
        network: allocatedIntent.network,
        amountMinor: allocatedIntent.amountMinor,
        destination: allocatedIntent.destination,
        paymentReference:
          allocatedIntent.paymentReference,
        expiresAt: allocatedIntent.expiresAt
      }
    };
  }

  async function submitTransaction({
    intentId,
    txId
  }) {
    return recordTransaction({
      intentId,
      txId
    });
  }

  async function verifyAndConfirm({
    intentId,
    minimumConfirmations = 1
  }) {
    if (!intentId) {
      throw new Error('intentId is required');
    }

    if (
      !Number.isSafeInteger(minimumConfirmations) ||
      minimumConfirmations < 0
    ) {
      throw new Error(
        'minimumConfirmations must be a non-negative safe integer'
      );
    }

    const intent = await PaymentIntent.findOne({
      intentId
    });

    if (!intent) {
      throw new Error('payment intent not found');
    }

    /*
     * A confirmed intent is already settled.
     * Return through the domain service so replay handling
     * remains centralized in paymentIntentService.
     */
    if (intent.status === 'CONFIRMED') {
      return confirmPaymentIntent({
        intentId: intent.intentId,
        verification: {
          txId: intent.txId
        }
      });
    }

    if (intent.status !== 'SUBMITTED') {
      throw new Error(
        `payment cannot be verified from state ${intent.status}`
      );
    }

    if (!intent.txId) {
      throw new Error(
        'payment intent has no transaction id'
      );
    }

    if (!intent.destination) {
      throw new Error(
        'payment intent has no destination'
      );
    }

    const rail = getRail(intent.asset);

    /*
     * Important:
     * verification parameters come from the persisted intent,
     * not from caller-supplied payment data.
     */
    const verification = await rail.verify({
      txId: intent.txId,
      destination: intent.destination,
      paymentReference: intent.paymentReference,
      network: intent.network,
      amountMinor: intent.amountMinor,
      minimumConfirmations
    });

    return confirmPaymentIntent({
      intentId: intent.intentId,
      verification
    });
  }

  return {
    createCheckout,
    submitTransaction,
    verifyAndConfirm
  };
}

module.exports = {
  createPaymentService
};