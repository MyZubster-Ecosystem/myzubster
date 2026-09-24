'use strict';

const { PLANS } = require('./zorgaxPlanCatalog');
const unified = require('./zorgaxUnifiedCheckoutService');

const SUPPORTED_ASSETS = Object.freeze(['BTC', 'ETH']);
const INTENT_TTL_MS = unified.INTENT_TTL_MS;
const DEFAULT_BTC_WALLET = unified.btcWallet();

function publicWallets() {
  return {
    ETH: unified.ethWallet(),
    BTC: unified.btcWallet(),
    XMR: '',
    TARI: ''
  };
}

function isSettlementRailOperational(asset) {
  const normalized = String(asset || '').toUpperCase();
  if (normalized === 'BTC') return Boolean(unified.btcWallet());
  if (normalized === 'ETH') return Boolean(unified.ethWallet() && process.env.ZORGAX_ETH_RPC_URL);
  return false;
}

module.exports = {
  PLANS,
  SUPPORTED_ASSETS,
  INTENT_TTL_MS,
  DEFAULT_BTC_WALLET,
  publicWallets,
  isSettlementRailOperational,
  catalog: unified.catalog,
  createCheckoutIntent: unified.createCheckoutIntent,
  getPaymentIntent: unified.getPaymentIntent,
  listPaymentIntents: unified.listPaymentIntents,
  publicIntent: unified.publicIntent
};
