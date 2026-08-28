'use strict';

const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const { verifySettlement } = require('./zorgaxChainVerifierService');
const { recordVerifiedPayment } = require('./zorgaxSubscriptionService');

async function verifyAndActivatePaymentIntent({ ownerId, intentId, paymentReference, renewalOf }) {
  const now = new Date();
  const intent = await ZorgaxPaymentIntent.findOne({ intentId: String(intentId || ''), ownerId: String(ownerId) });
  if (!intent) throw new Error('Payment intent non trovato');
  if (intent.consumedAt || intent.settlement.status === 'VERIFIED') throw new Error('Payment intent già utilizzato');
  if (intent.settlement.status !== 'PENDING') throw new Error(`Payment intent non verificabile (${intent.settlement.status})`);
  if (intent.expiresAt <= now) {
    intent.settlement.status = 'EXPIRED';
    await intent.save();
    throw new Error('Payment intent scaduto');
  }

  // The client supplies only the chain payment reference. Plan, asset,
  // destination and expected amount always come from the persisted intent.
  const verification = await verifySettlement({
    asset: intent.asset,
    paymentReference,
    destination: intent.destination,
    cryptoAmount: intent.quote.cryptoAmount
  });

  const subscription = await recordVerifiedPayment({
    ownerId: intent.ownerId,
    planId: intent.plan,
    asset: intent.asset,
    paymentReference: verification.paymentReference,
    verification,
    renewalOf
  });

  intent.settlement.status = 'VERIFIED';
  intent.settlement.paymentReference = verification.paymentReference;
  intent.settlement.verifier = verification.verifier;
  intent.settlement.confirmations = verification.confirmations;
  intent.settlement.verifiedAt = new Date();
  intent.consumedAt = new Date();
  await intent.save();

  return {
    intentId: intent.intentId,
    settlementStatus: intent.settlement.status,
    subscriptionId: String(subscription._id),
    plan: subscription.plan,
    access: subscription.access
  };
}

module.exports = { verifyAndActivatePaymentIntent };
