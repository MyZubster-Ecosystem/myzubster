'use strict';

const SUPPORTED_CRYPTO_CURRENCIES = Object.freeze(['XMR', 'BTC', 'ETH']);
const DEFAULT_ACCEPTED_CRYPTO_CURRENCIES = Object.freeze(['XMR']);
const DEFAULT_SETTLEMENT_CURRENCY = 'XMR';

function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeAcceptedCurrencies(values) {
  if (!Array.isArray(values) || values.length === 0) return [...DEFAULT_ACCEPTED_CRYPTO_CURRENCIES];
  const normalized = [...new Set(values.map(normalizeCurrency).filter(Boolean))];
  const unsupported = normalized.filter(currency => !SUPPORTED_CRYPTO_CURRENCIES.includes(currency));
  if (unsupported.length) {
    const error = new Error(`Valute crypto non supportate: ${unsupported.join(', ')}`);
    error.code = 'UNSUPPORTED_CRYPTO_CURRENCY';
    throw error;
  }
  return normalized;
}

function validateSettlementCurrency(value, acceptedCurrencies) {
  const currency = normalizeCurrency(value || DEFAULT_SETTLEMENT_CURRENCY);
  if (!SUPPORTED_CRYPTO_CURRENCIES.includes(currency)) {
    const error = new Error(`Valuta di settlement non supportata: ${currency}`);
    error.code = 'UNSUPPORTED_SETTLEMENT_CURRENCY';
    throw error;
  }
  if (!acceptedCurrencies.includes(currency)) {
    const error = new Error('La valuta di settlement deve essere inclusa tra le valute accettate');
    error.code = 'SETTLEMENT_CURRENCY_NOT_ACCEPTED';
    throw error;
  }
  return currency;
}

function publicCryptoCapabilities(membership) {
  const acceptedCryptoCurrencies = normalizeAcceptedCurrencies(membership?.acceptedCryptoCurrencies);
  const preferredSettlementCurrency = acceptedCryptoCurrencies.includes(membership?.preferredSettlementCurrency)
    ? membership.preferredSettlementCurrency
    : DEFAULT_SETTLEMENT_CURRENCY;
  return {
    supportedCurrencies:[...SUPPORTED_CRYPTO_CURRENCIES],
    acceptedCryptoCurrencies,
    preferredSettlementCurrency,
    conversion:{
      requested:Boolean(membership?.cryptoConversionEnabled),
      available:false,
      mode:'DISABLED',
      message:'Conversione automatica non ancora attiva: richiede provider/backend, sicurezza e compliance approvati.'
    }
  };
}

module.exports = {
  SUPPORTED_CRYPTO_CURRENCIES,
  DEFAULT_ACCEPTED_CRYPTO_CURRENCIES,
  DEFAULT_SETTLEMENT_CURRENCY,
  normalizeAcceptedCurrencies,
  validateSettlementCurrency,
  publicCryptoCapabilities
};
