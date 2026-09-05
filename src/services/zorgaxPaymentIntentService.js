'use strict';

const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const { verifySettlement } = require('./zorgaxChainVerifierService');
const { recordVerifiedPayment } = require('./zorgaxSubscriptionService');

const RETRY_DELAY_MS = 15 * 1000;

function normalizePaymentReference(asset, value) {
  const reference = String(value || '').trim().toLowerCase();
  if (String(asset || '').toUpperCase() === 'BTC' && !/^[0-9a-f]{64}$/.test(reference)) {
    throw new Error('Riferimento pagamento BTC non valido');
  }
  if (!reference || reference.length > 180) throw new Error('Riferimento pagamento non valido');
  return reference;
}

function isRetryableVerificationError(error) {
  const message = String(error?.message || '');
  return /Conferme blockchain insufficienti|Pagamento BTC non trovato|Verifier .* non disponibile/i.test(message);
}

function pendingResult(intent, message = null) {
  return {
    intentId: intent.intentId,
    settlementStatus: 'PENDING',
    pending: true,
    automaticMonitoring: true,
    paymentReference: intent.settlement.paymentReference,
    confirmations: intent.settlement.confirmations ?? 0,
    nextCheckAt: intent.settlement.nextCheckAt || null,
    message: message || intent.settlement.lastError || 'Pagamento in attesa di conferma'
  };
}

async function expireIntent(intent) {
  intent.settlement.status = 'EXPIRED';
  intent.settlement.nextCheckAt = null;
  await intent.save();
  throw new Error('Payment intent scaduto');
}

function submissionWasInTime(intent) {
  const submittedAt = intent.settlement?.submittedAt;
  return Boolean(submittedAt && new Date(submittedAt) <= new Date(intent.expiresAt));
}

async function bindPaymentReference(intent, paymentReference) {
  const reference = normalizePaymentReference(intent.asset, paymentReference);
  const existing = String(intent.settlement.paymentReference || '').trim().toLowerCase();

  if (existing && existing !== reference) throw new Error('Payment intent già associato a un altro TXID');
  if (existing) return reference;
  if (new Date(intent.expiresAt) <= new Date()) await expireIntent(intent);

  intent.settlement.paymentReference = reference;
  intent.settlement.submittedAt = new Date();
  intent.settlement.nextCheckAt = new Date();
  intent.settlement.lastError = null;

  try {
    await intent.save();
  } catch (error) {
    if (error?.code === 11000) throw new Error('Pagamento già associato a un altro intent');
    throw error;
  }

  return reference;
}

async function recordTrackingFailure(intent, error) {
  const now = new Date();
  intent.settlement.lastCheckedAt = now;
  intent.settlement.nextCheckAt = new Date(now.getTime() + RETRY_DELAY_MS);
  intent.settlement.checkAttempts = Number(intent.settlement.checkAttempts || 0) + 1;
  intent.settlement.lastError = String(error?.message || 'Verifica temporaneamente non disponibile').slice(0, 300);
  await intent.save();
  return pendingResult(intent, intent.settlement.lastError);
}

async function clearRejectedReference(intent, error) {
  intent.settlement.paymentReference = undefined;
  intent.settlement.submittedAt = null;
  intent.settlement.nextCheckAt = null;
  intent.settlement.lastCheckedAt = new Date();
  intent.settlement.checkAttempts = Number(intent.settlement.checkAttempts || 0) + 1;
  intent.settlement.lastError = String(error?.message || 'Pagamento non verificato').slice(0, 300);
  await intent.save();
}

async function activateBoundPaymentIntent(intent) {
  if (!submissionWasInTime(intent) && new Date(intent.expiresAt) <= new Date()) await expireIntent(intent);

  let verification;
  try {
    verification = await verifySettlement({
      asset: intent.asset,
      paymentReference: intent.settlement.paymentReference,
      destination: intent.destination,
      cryptoAmount: intent.quote.cryptoAmount
    });
  } catch (error) {
    if (isRetryableVerificationError(error)) return recordTrackingFailure(intent, error);
    await clearRejectedReference(intent, error);
    throw error;
  }

  const subscription = await recordVerifiedPayment({
    ownerId: intent.ownerId,
    planId: intent.plan,
    asset: intent.asset,
    paymentReference: verification.paymentReference,
    verification,
    renewalOf: intent.renewalOf || null
  });

  intent.settlement.status = 'VERIFIED';
  intent.settlement.paymentReference = verification.paymentReference;
  intent.settlement.verifier = verification.verifier;
  intent.settlement.confirmations = verification.confirmations;
  intent.settlement.verifiedAt = new Date();
  intent.settlement.lastCheckedAt = new Date();
  intent.settlement.nextCheckAt = null;
  intent.settlement.lastError = null;
  intent.settlement.checkAttempts = Number(intent.settlement.checkAttempts || 0) + 1;
  intent.consumedAt = new Date();
  await intent.save();

  return {
    intentId: intent.intentId,
    settlementStatus: intent.settlement.status,
    pending: false,
    verified: true,
    subscriptionId: String(subscription._id),
    plan: subscription.plan,
    access: subscription.access
  };
}

async function verifyAndActivatePaymentIntent({ ownerId, intentId, paymentReference }) {
  const intent = await ZorgaxPaymentIntent.findOne({ intentId: String(intentId || ''), ownerId: String(ownerId) });
  if (!intent) throw new Error('Payment intent non trovato');
  if (intent.consumedAt || intent.settlement.status === 'VERIFIED') throw new Error('Payment intent già utilizzato');
  if (intent.settlement.status !== 'PENDING') throw new Error(`Payment intent non verificabile (${intent.settlement.status})`);

  await bindPaymentReference(intent, paymentReference);
  return activateBoundPaymentIntent(intent);
}

async function refreshPaymentIntent({ ownerId, intentId }) {
  const intent = await ZorgaxPaymentIntent.findOne({ intentId: String(intentId || ''), ownerId: String(ownerId) });
  if (!intent) throw new Error('Payment intent non trovato');

  if (intent.settlement.status === 'VERIFIED') {
    return {
      intentId: intent.intentId,
      settlementStatus: 'VERIFIED',
      pending: false,
      verified: true,
      plan: intent.plan
    };
  }

  if (intent.settlement.status !== 'PENDING') throw new Error(`Payment intent non verificabile (${intent.settlement.status})`);
  if (!intent.settlement.paymentReference) {
    if (new Date(intent.expiresAt) <= new Date()) await expireIntent(intent);
    return pendingResult(intent, 'TXID non ancora inviato');
  }

  const nextCheckAt = intent.settlement.nextCheckAt ? new Date(intent.settlement.nextCheckAt) : null;
  if (nextCheckAt && nextCheckAt > new Date()) return pendingResult(intent);
  return activateBoundPaymentIntent(intent);
}

module.exports = {
  RETRY_DELAY_MS,
  isRetryableVerificationError,
  normalizePaymentReference,
  refreshPaymentIntent,
  verifyAndActivatePaymentIntent
};
