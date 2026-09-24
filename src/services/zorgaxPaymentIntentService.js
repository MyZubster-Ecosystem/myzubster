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
  return Boolean(intent && intent.settlement && intent.quote && intent.plan && intent.destination);
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
  if (intent.expiresAt && intent.expiresAt <= new Date()) {
    intent.settlement.status = 'EXPIRED';
    await intent.save();
    throw new Error('Payment intent scaduto');
  }

  const reference = normalizePaymentReference(intent.asset, paymentReference);
  const verification = await verifySettlement({
    asset: intent.asset,
    paymentReference: reference,
    destination: intent.destination,
    cryptoAmount: intent.quote.cryptoAmount
  });

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
    if (legacy.expiresAt && legacy.expiresAt <= new Date()) {
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
