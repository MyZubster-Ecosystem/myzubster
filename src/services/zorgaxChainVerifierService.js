'use strict';

const crypto = require('crypto');
const { SUPPORTED_ASSETS } = require('./zorgaxMonetizationService');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateVerificationPayload(payload, expected) {
  const asset = String(payload?.asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(asset)) throw new Error('Asset non supportato');
  if (asset !== expected.asset) throw new Error('Asset pagamento non corrispondente');
  if (String(payload?.destination || '') !== String(expected.destination || '')) throw new Error('Destinazione pagamento non corrispondente');
  const paidAmount = Number(payload?.amount);
  const expectedAmount = Number(expected.cryptoAmount);
  if (!Number.isFinite(paidAmount) || paidAmount < expectedAmount) throw new Error('Importo pagamento insufficiente');
  const confirmations = Number(payload?.confirmations);
  const minConfirmations = Number(expected.minConfirmations);
  if (!Number.isInteger(confirmations) || confirmations < minConfirmations) throw new Error('Conferme blockchain insufficienti');
  const paymentReference = String(payload?.paymentReference || '').trim();
  if (!paymentReference || paymentReference.length > 180) throw new Error('Riferimento pagamento non valido');
  return {
    verified: true,
    verifier: String(payload?.verifier || `${asset.toLowerCase()}-trusted-verifier`).slice(0, 120),
    paymentReference,
    confirmations,
    amount: paidAmount
  };
}

async function verifySettlement({ asset, paymentReference, destination, cryptoAmount, fetchImpl = global.fetch }) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  const endpoint = process.env[`ZORGAX_${normalizedAsset}_VERIFIER_URL`];
  const token = process.env[`ZORGAX_${normalizedAsset}_VERIFIER_TOKEN`];
  if (!endpoint || !token) throw new Error(`Verifier ${normalizedAsset} non configurato`);
  if (typeof fetchImpl !== 'function') throw new Error('HTTP client non disponibile');

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ asset: normalizedAsset, paymentReference, destination, expectedAmount: cryptoAmount })
  });
  if (!response.ok) throw new Error(`Verifier ${normalizedAsset} non disponibile (${response.status})`);
  const payload = await response.json();
  if (payload?.verified !== true) throw new Error('Pagamento non verificato');
  if (payload?.requestToken && !safeEqual(payload.requestToken, token)) throw new Error('Risposta verifier non autenticata');
  const minConfirmations = Number(process.env[`ZORGAX_${normalizedAsset}_MIN_CONFIRMATIONS`] || 1);
  return validateVerificationPayload(payload, { asset: normalizedAsset, destination, cryptoAmount, minConfirmations });
}

module.exports = { validateVerificationPayload, verifySettlement };
