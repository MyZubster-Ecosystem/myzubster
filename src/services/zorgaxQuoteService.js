'use strict';

const { SUPPORTED_ASSETS } = require('./zorgaxMonetizationService');

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

function normalizeQuote(asset, payload, priceEur) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  const eurPerCoin = Number(payload?.eurPerCoin);
  if (!Number.isFinite(eurPerCoin) || eurPerCoin <= 0) throw new Error('Quotazione EUR non valida');
  const observedAt = new Date(payload?.observedAt || Date.now());
  if (Number.isNaN(observedAt.getTime())) throw new Error('Timestamp quotazione non valido');
  const cryptoAmount = Number((Number(priceEur) / eurPerCoin).toPrecision(12));
  return {
    asset: normalizedAsset,
    denomination: 'EUR',
    fiatAmount: Number(priceEur),
    eurPerCoin,
    cryptoAmount,
    observedAt: observedAt.toISOString(),
    source: String(payload?.source || 'trusted-quote-provider').slice(0, 120)
  };
}

async function quotePlan({ asset, priceEur, fetchImpl = global.fetch }) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  const endpoint = process.env.ZORGAX_QUOTE_API_URL;
  if (!endpoint) throw new Error('Provider quotazioni non configurato');
  if (typeof fetchImpl !== 'function') throw new Error('HTTP client non disponibile');

  const url = new URL(endpoint);
  url.searchParams.set('asset', normalizedAsset);
  url.searchParams.set('currency', 'EUR');
  const response = await fetchImpl(url, {
    headers: process.env.ZORGAX_QUOTE_API_KEY ? { Authorization: `Bearer ${process.env.ZORGAX_QUOTE_API_KEY}` } : {}
  });
  if (!response.ok) throw new Error(`Provider quotazioni non disponibile (${response.status})`);
  const payload = await response.json();
  const quote = normalizeQuote(normalizedAsset, payload, priceEur);
  const maxAgeMs = Number(process.env.ZORGAX_QUOTE_MAX_AGE_MS || DEFAULT_MAX_AGE_MS);
  if (Date.now() - new Date(quote.observedAt).getTime() > maxAgeMs) throw new Error('Quotazione scaduta');
  return quote;
}

module.exports = { DEFAULT_MAX_AGE_MS, normalizeQuote, quotePlan };
