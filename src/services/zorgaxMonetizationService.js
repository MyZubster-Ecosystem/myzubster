const crypto = require('crypto');

const PaymentIntent = require('../models/PaymentIntent');
const legacyMonetization = require('./zorgaxLegacyMonetizationService');

const {
  ZorgaxPurchase,
  PURCHASE_STATUSES
} = require('../models/ZorgaxPurchase');

const {
  resolvePurchase
} = require('./zorgaxPricingService');

const {
  grantPurchaseCredits
} = require('./zorgaxCreditService');

const {
  grantPurchaseEntitlement
} = require('./zorgaxEntitlementService');

function requireOwnerId(ownerId) {
  const normalized = String(ownerId || '').trim();

  if (!normalized) {
    throw new Error('ownerId is required');
  }

  return normalized;
}

function requirePurchaseId(purchaseId) {
  const normalized = String(purchaseId || '').trim();

  if (!normalized) {
    throw new Error('purchaseId is required');
  }

  return normalized;
}

function createPurchaseId() {
  return `zpur_${crypto.randomUUID()}`;
}

function publicPurchase(purchase) {
  const source =
    typeof purchase?.toObject === 'function'
      ? purchase.toObject()
      : purchase;

  if (!source) {
    return null;
  }

  return {
    purchaseId: source.purchaseId,
    ownerId: source.ownerId,
    productId: source.productId,
    paymentIntentId: source.paymentIntentId,
    creditsGranted: source.creditsGranted,
    payment: source.payment,
    entitlement: source.entitlement,
    status: source.status,
    creditedAt: source.creditedAt,
    metadata: source.metadata,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

function createZorgaxMonetizationService({
  paymentService,
  PaymentIntentModel = PaymentIntent,
  ZorgaxPurchaseModel = ZorgaxPurchase,
  pricingService = {
    resolvePurchase
  },
  creditService = {
    grantPurchaseCredits
  },
  entitlementService = {
    grantPurchaseEntitlement
  },
  accountingService = null
}) {
  if (!paymentService) {
    throw new Error('paymentService is required');
  }

  async function createCheckout({
    ownerId,
    productId,
    metadata = {}
  }) {
    const normalizedOwnerId = requireOwnerId(ownerId);

    const offer = await pricingService.resolvePurchase(
      productId
    );

    /*
     * Security boundary:
     * price, credits and entitlement policy always come from the persisted
     * Zorgax product catalog, never from client input.
     */
    const checkout = await paymentService.createCheckout({
      ownerId: normalizedOwnerId,
      purpose: offer.purpose,
      asset: offer.payment.asset,
      network: offer.payment.network,
      amountMinor: offer.payment.amountMinor,

      metadata: {
        ...metadata,
        zorgaxProductId: offer.productId
      }
    });

    const intent = checkout.intent || checkout;

    if (!intent?.intentId) {
      throw new Error(
        'Payment service did not return a payment intent'
      );
    }

    const purchase = await ZorgaxPurchaseModel.create({
      purchaseId: createPurchaseId(),
      ownerId: normalizedOwnerId,
      productId: offer.productId,
      paymentIntentId: intent.intentId,
      creditsGranted: offer.creditsGranted,

      payment: {
        asset: offer.payment.asset,
        network: offer.payment.network,
        amountMinor: offer.payment.amountMinor
      },

      entitlement: offer.entitlement || undefined,
      status: PURCHASE_STATUSES.PENDING,
      metadata
    });

    return {
      purchase: publicPurchase(purchase),
      checkout
    };
  }

  async function getPurchase({
    ownerId,
    purchaseId
  }) {
    const normalizedOwnerId = requireOwnerId(ownerId);
    const normalizedPurchaseId =
      requirePurchaseId(purchaseId);

    const purchase = await ZorgaxPurchaseModel.findOne({
      purchaseId: normalizedPurchaseId,
      ownerId: normalizedOwnerId
    });

    if (!purchase) {
      throw new Error('Zorgax purchase not found');
    }

    return purchase;
  }

  async function grantEntitlementIfConfigured(purchase) {
    if (!purchase.entitlement?.tier) {
      return null;
    }

    return entitlementService.grantPurchaseEntitlement({
      ownerId: purchase.ownerId,
      purchaseId: purchase.purchaseId,
      productId: purchase.productId,
      entitlementKey: purchase.entitlement.key || 'zorgax.access',
      tier: purchase.entitlement.tier,
      durationDays: purchase.entitlement.durationDays,
      metadata: {
        paymentIntentId: purchase.paymentIntentId
      }
    });
  }

  async function recognizeRevenueIfConfigured(intent) {
    if (!accountingService) return null;
    if (typeof accountingService.recognizeConfirmedPaymentIntentDocument !== 'function') {
      throw new Error('accountingService.recognizeConfirmedPaymentIntentDocument is required');
    }
    return accountingService.recognizeConfirmedPaymentIntentDocument({ intent });
  }

  async function settlePurchase({
    ownerId,
    purchaseId,
    minimumConfirmations = 1
  }) {
    const purchase = await getPurchase({
      ownerId,
      purchaseId
    });

    /*
     * If the ledger already granted this purchase,
     * grantPurchaseCredits returns replay=true. Entitlements use the purchase
     * id as their own one-time replay key, so retries are safe at both layers.
     * Existing CREDITED purchases can be backfilled into accounting through the
     * dedicated admin accounting sync endpoint.
     */
    if (purchase.status === PURCHASE_STATUSES.CREDITED) {
      const creditResult =
        await creditService.grantPurchaseCredits({
          ownerId: purchase.ownerId,
          credits: purchase.creditsGranted,
          paymentIntentId: purchase.paymentIntentId,
          productId: purchase.productId,

          metadata: {
            purchaseId: purchase.purchaseId
          }
        });

      const entitlementResult =
        await grantEntitlementIfConfigured(purchase);

      return {
        purchase: publicPurchase(purchase),
        paymentIntent: null,
        credit: creditResult,
        entitlement: entitlementResult,
        accounting: null
      };
    }

    const verification =
      await paymentService.verifyAndConfirm({
        intentId: purchase.paymentIntentId,
        minimumConfirmations
      });

    /*
     * Reload the PaymentIntent from the database instead
     * of trusting arbitrary values returned by a client.
     */
    const intent = await PaymentIntentModel.findOne({
      intentId: purchase.paymentIntentId,
      ownerId: purchase.ownerId
    });

    if (!intent) {
      throw new Error(
        'Payment intent for Zorgax purchase not found'
      );
    }

    if (intent.status !== 'CONFIRMED') {
      return {
        purchase: publicPurchase(purchase),
        paymentIntent:
          typeof intent.toObject === 'function'
            ? intent.toObject()
            : intent,
        verification,
        credit: null,
        entitlement: null,
        accounting: null
      };
    }

    /*
     * Bind settlement to the original server-side
     * purchase snapshot.
     */
    if (
      String(intent.asset).toUpperCase() !==
        String(purchase.payment.asset).toUpperCase() ||
      intent.network !== purchase.payment.network ||
      intent.amountMinor !== purchase.payment.amountMinor
    ) {
      throw new Error(
        'Confirmed PaymentIntent does not match Zorgax purchase'
      );
    }

    const creditResult =
      await creditService.grantPurchaseCredits({
        ownerId: purchase.ownerId,
        credits: purchase.creditsGranted,
        paymentIntentId: purchase.paymentIntentId,
        productId: purchase.productId,

        metadata: {
          purchaseId: purchase.purchaseId
        }
      });

    const entitlementResult =
      await grantEntitlementIfConfigured(purchase);

    /*
     * Revenue recognition is idempotent on the PaymentIntent source reference.
     * It happens before the purchase is marked CREDITED, so an accounting error
     * keeps the purchase retryable. Credit and entitlement grants are already
     * replay-safe on their own keys.
     */
    const accountingResult = await recognizeRevenueIfConfigured(intent);

    purchase.status = PURCHASE_STATUSES.CREDITED;

    if (!purchase.creditedAt) {
      purchase.creditedAt = new Date();
    }

    await purchase.save();

    return {
      purchase: publicPurchase(purchase),
      paymentIntent:
        typeof intent.toObject === 'function'
          ? intent.toObject()
          : intent,
      verification,
      credit: creditResult,
      entitlement: entitlementResult,
      accounting: accountingResult
    };
  }

  return {
    createCheckout,
    getPurchase,
    settlePurchase
  };
}

module.exports = {
  ...legacyMonetization,
  createZorgaxMonetizationService,
  publicPurchase,
  requireOwnerId,
  requirePurchaseId
};
