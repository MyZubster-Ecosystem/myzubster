'use strict';

const { SUPPORTED_ASSETS } = require('./zorgaxAssetCatalog');

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;
const DEFAULT_BTC_QUOTE_URL = 'https://api.coingecko.com/api/v3/simple/price';
const DEFAULT_ETH_QUOTE_URL = DEFAULT_BTC_QUOTE_URL;

function normalizeQuote(asset, payload, priceEur) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  const eurPerCoin = Number(payload?.eurPerCoin);
  if (!Number.isFinite(eurPerCoin) || eurPerCoin <= 0) throw new Error('Quotazione EUR non valida');
  const observedAt = new Date(payload?.observedAt || Date.now());
  if (Number.isNaN(observedAt.getTime())) throw new Error('Timestamp quotazione non valido');

  const rawAmount = Number(priceEur) / eurPerCoin;
  const cryptoAmount = normalizedAsset === 'BTC'
    ? (Math.ceil(rawAmount * 1e8) / 1e8).toFixed(8)
    : normalizedAsset === 'ETH'
      ? (Math.ceil(rawAmount * 1e9) / 1e9).toFixed(9)
      : Number(rawAmount.toPrecision(12));

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

async function fetchDefaultCoinGeckoQuote(asset, fetchImpl) {
  const normalizedAsset = String(asset || '').toUpperCase();
  const id = normalizedAsset === 'ETH' ? 'ethereum' : 'bitcoin';
  const url = new URL(normalizedAsset === 'ETH' ? DEFAULT_ETH_QUOTE_URL : DEFAULT_BTC_QUOTE_URL);
  url.searchParams.set('ids', id);
  url.searchParams.set('vs_currencies', 'eur');
  url.searchParams.set('include_last_updated_at', 'true');

  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Provider quotazioni ${normalizedAsset} non disponibile (${response.status})`);
  const payload = await response.json();
  const eurPerCoin = Number(payload?.[id]?.eur);
  const lastUpdatedAt = Number(payload?.[id]?.last_updated_at);
  if (!Number.isFinite(eurPerCoin) || eurPerCoin <= 0) throw new Error(`Quotazione ${normalizedAsset}/EUR non valida`);

  return {
    eurPerCoin,
    observedAt: Number.isFinite(lastUpdatedAt) && lastUpdatedAt > 0 ? new Date(lastUpdatedAt * 1000).toISOString() : new Date().toISOString(),
    source: 'coingecko-keyless'
  };
}

async function fetchDefaultBitcoinQuote(fetchImpl) {
  return fetchDefaultCoinGeckoQuote('BTC', fetchImpl);
}

async function fetchDefaultEthereumQuote(fetchImpl) {
  return fetchDefaultCoinGeckoQuote('ETH', fetchImpl);
}

async function quotePlan({ asset, priceEur, fetchImpl = global.fetch }) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  if (typeof fetchImpl !== 'function') throw new Error('HTTP client non disponibile');

  let payload;
  const endpoint = process.env.ZORGAX_QUOTE_API_URL;
  if (endpoint) {
    const url = new URL(endpoint);
    url.searchParams.set('asset', normalizedAsset);
    url.searchParams.set('currency', 'EUR');
    const response = await fetchImpl(url, {
      headers: process.env.ZORGAX_QUOTE_API_KEY ? { Authorization: `Bearer ${process.env.ZORGAX_QUOTE_API_KEY}` } : {}
    });
    if (!response.ok) throw new Error(`Provider quotazioni non disponibile (${response.status})`);
    payload = await response.json();
  } else if (normalizedAsset === 'BTC') {
    payload = await fetchDefaultBitcoinQuote(fetchImpl);
  } else if (normalizedAsset === 'ETH') {
    payload = await fetchDefaultEthereumQuote(fetchImpl);
  } else {
    throw new Error('Provider quotazioni non configurato');
  }

  const quote = normalizeQuote(normalizedAsset, payload, priceEur);
  const maxAgeMs = Number(process.env.ZORGAX_QUOTE_MAX_AGE_MS || DEFAULT_MAX_AGE_MS);
  if (Date.now() - new Date(quote.observedAt).getTime() > maxAgeMs) throw new Error('Quotazione scaduta');
  return quote;
}

module.exports = { DEFAULT_MAX_AGE_MS, DEFAULT_BTC_QUOTE_URL, DEFAULT_ETH_QUOTE_URL, normalizeQuote, fetchDefaultBitcoinQuote, fetchDefaultEthereumQuote, quotePlan };
