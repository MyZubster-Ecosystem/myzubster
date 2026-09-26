'use strict';

const { PLANS } = require('./zorgaxPlanCatalog');
const unified = require('./zorgaxUnifiedCheckoutService');

const SUPPORTED_ASSETS = Object.freeze(['BTC']);
const INTENT_TTL_MS = unified.INTENT_TTL_MS;
function btcWallet() {
  return typeof unified.btcWallet === 'function' ? unified.btcWallet() : '';
}

const DEFAULT_BTC_WALLET = btcWallet();

function publicWallets() {
  return {
    ETH: '',
    BTC: btcWallet(),
    XMR: '',
    TARI: ''
  };
}

function isSettlementRailOperational(asset) {
  return String(asset || '').toUpperCase() === 'BTC' && Boolean(btcWallet());
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
