'use strict';

const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const { verifySettlement } = require('./zorgaxChainVerifierService');
const { recordVerifiedPayment } = require('./zorgaxSubscriptionService');
const unified = require('./zorgaxUnifiedCheckoutService');

function normalizePaymentReference(asset, value) {
  if (String(asset || '').toUpperCase() === 'BTC') return unified.normalizeTxid(value);
  if (String(asset || '').toUpperCase() === 'ETH') return unified.normalizeEthTxHash(value);
  const reference = String(value || '').trim();
  if (!reference || reference.length > 180) throw new Error('Riferimento pagamento non valido');
  return reference;
}

function isRetryableVerificationError(error) {
  return /Conferme blockchain insufficienti|Pagamento (BTC|ETH) non trovato|Verifier .* non disponibile/i.test(String(error?.message || ''));
}

function isLegacyIntent(intent) {
  return Boolean(intent && intent.settlement);
}

async function loadLegacyIntent(ownerId, intentId) {
  try {
    return await ZorgaxPaymentIntent.findOne({ intentId:String(intentId || ''), ownerId:String(ownerId) });
  } catch (_error) {
    return null;
  }
}

async function verifyLegacyIntent({ intent, ownerId, paymentReference }) {
  if (intent.consumedAt || intent.settlement?.status === 'VERIFIED') {
    throw new Error('Payment intent già utilizzato');
  }
  const existingReference = intent.settlement?.paymentReference || null;
  const submittedAt = intent.settlement?.submittedAt ? new Date(intent.settlement.submittedAt) : null;
  if (intent.expiresAt && intent.expiresAt <= new Date() && !(existingReference && submittedAt && submittedAt <= intent.expiresAt)) {
    intent.settlement.status = 'EXPIRED';
    await intent.save();
    throw new Error('Payment intent scaduto');
  }

  const reference = normalizePaymentReference(intent.asset, paymentReference || existingReference);
  if (!intent.settlement.paymentReference) intent.settlement.paymentReference = reference;
  if (!intent.settlement.submittedAt) intent.settlement.submittedAt = new Date();

  let verification;
  try {
    verification = await verifySettlement({
      asset: intent.asset,
      paymentReference: reference,
      destination: intent.destination,
      cryptoAmount: intent.quote.cryptoAmount
    });
  } catch (error) {
    if (!isRetryableVerificationError(error)) throw error;
    intent.settlement.nextCheckAt = new Date(Date.now() + unified.RETRY_DELAY_MS);
    intent.settlement.checkAttempts = Number(intent.settlement.checkAttempts || 0) + 1;
    intent.settlement.lastError = String(error.message).slice(0, 300);
    await intent.save();
    return {
      intentId:intent.intentId,
      settlementStatus:'PENDING',
      pending:true,
      automaticMonitoring:true,
      paymentReference:reference,
      confirmations:intent.settlement.confirmations || 0,
      nextCheckAt:intent.settlement.nextCheckAt,
      message:error.message
    };
  }

  const access = await recordVerifiedPayment({
    ownerId: String(ownerId),
    planId: intent.plan,
    asset: intent.asset,
    destination: intent.destination,
    cryptoAmount: intent.quote.cryptoAmount,
    paymentReference: verification.paymentReference || reference,
    confirmations: verification.confirmations,
    verifier: verification.verifier
  });

  intent.settlement.status = 'VERIFIED';
  intent.settlement.paymentReference = verification.paymentReference || reference;
  intent.settlement.confirmations = verification.confirmations || 0;
  intent.settlement.verifier = verification.verifier || null;
  intent.consumedAt = new Date();
  await intent.save();

  return {
    intentId:intent.intentId,
    settlementStatus:'VERIFIED',
    pending:false,
    verified:true,
    plan:intent.plan,
    access:access?.access || access
  };
}

async function verifyAndActivatePaymentIntent(args) {
  const legacy = await loadLegacyIntent(args.ownerId, args.intentId);
  if (isLegacyIntent(legacy)) return verifyLegacyIntent({ intent:legacy, ...args });
  return unified.verifyAndActivatePaymentIntent(args);
}

async function refreshPaymentIntent(args) {
  const legacy = await loadLegacyIntent(args.ownerId, args.intentId);
  if (isLegacyIntent(legacy)) {
    if (legacy.consumedAt || legacy.settlement?.status === 'VERIFIED') {
      return { intentId:legacy.intentId, settlementStatus:'VERIFIED', pending:false, verified:true, plan:legacy.plan };
    }
    const submittedAt = legacy.settlement?.submittedAt ? new Date(legacy.settlement.submittedAt) : null;
    const wasSubmittedInTime = Boolean(legacy.settlement?.paymentReference && submittedAt && submittedAt <= legacy.expiresAt);
    if (legacy.expiresAt && legacy.expiresAt <= new Date() && !wasSubmittedInTime) {
      legacy.settlement.status = 'EXPIRED';
      await legacy.save();
      throw new Error('Payment intent scaduto');
    }
    if (!legacy.settlement?.paymentReference) {
      return { intentId:legacy.intentId, settlementStatus:'PENDING', pending:true, automaticMonitoring:true, paymentReference:null };
    }
    return verifyLegacyIntent({ intent:legacy, ownerId:args.ownerId, paymentReference:legacy.settlement.paymentReference });
  }
  return unified.refreshPaymentIntent(args);
}

module.exports = {
  RETRY_DELAY_MS: unified.RETRY_DELAY_MS,
  isRetryableVerificationError,
  normalizePaymentReference,
  refreshPaymentIntent,
  verifyAndActivatePaymentIntent
};
