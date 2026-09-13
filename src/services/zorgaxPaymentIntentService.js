'use strict';

const unified = require('./zorgaxUnifiedCheckoutService');

function normalizePaymentReference(asset, value) {
  if (String(asset || '').toUpperCase() === 'BTC') return unified.normalizeTxid(value);
  const reference = String(value || '').trim();
  if (!reference || reference.length > 180) throw new Error('Riferimento pagamento non valido');
  return reference;
}

function isRetryableVerificationError(error) {
  return /Conferme blockchain insufficienti|Pagamento BTC non trovato|Verifier .* non disponibile/i.test(String(error?.message || ''));
}

module.exports = {
  RETRY_DELAY_MS: unified.RETRY_DELAY_MS,
  isRetryableVerificationError,
  normalizePaymentReference,
  refreshPaymentIntent: unified.refreshPaymentIntent,
  verifyAndActivatePaymentIntent: unified.verifyAndActivatePaymentIntent
};
