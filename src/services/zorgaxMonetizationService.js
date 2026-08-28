'use strict';

const PLANS = Object.freeze({
  free: {
    id: 'free',
    name: 'Zorgax Free',
    priceEur: 0,
    billing: 'free',
    features: ['assistant-base', 'limited-research']
  },
  pro: {
    id: 'pro',
    name: 'Zorgax Pro',
    priceEur: 9.90,
    billing: 'monthly-equivalent',
    features: ['assistant-advanced', 'web-research', 'workspace', 'priority-usage']
  },
  developer: {
    id: 'developer',
    name: 'Zorgax Developer',
    priceEur: 29.90,
    billing: 'monthly-equivalent',
    features: ['pro', 'api-access', 'automation', 'higher-limits']
  }
});

const SUPPORTED_ASSETS = Object.freeze(['ETH', 'BTC', 'XMR', 'TARI']);

function publicWallets() {
  return {
    ETH: process.env.ZORGAX_WALLET_ETH || process.env.WALLET_ETH || '',
    BTC: process.env.ZORGAX_WALLET_BTC || process.env.WALLET_BTC || '',
    XMR: process.env.ZORGAX_WALLET_XMR || process.env.WALLET_XMR || '',
    TARI: process.env.ZORGAX_WALLET_TARI || process.env.WALLET_TARI || ''
  };
}

function catalog() {
  const wallets = publicWallets();
  return {
    plans: Object.values(PLANS),
    settlement: {
      mode: 'non-custodial',
      assets: SUPPORTED_ASSETS,
      wallets: Object.fromEntries(Object.entries(wallets).map(([asset, address]) => [asset, { configured: Boolean(address), address }])),
      automaticSigning: false,
      privateKeysAccepted: false,
      note: 'External settlement must be independently verified before paid access is activated.'
    }
  };
}

function createCheckoutIntent({ planId, asset }) {
  const plan = PLANS[String(planId || '').toLowerCase()];
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!plan || plan.id === 'free') throw new Error('Piano a pagamento non valido');
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset di pagamento non supportato');
  const address = publicWallets()[normalizedAsset];
  if (!address) throw new Error(`Wallet pubblico ${normalizedAsset} non configurato`);

  return {
    intentId: `zorgax_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    plan: { id: plan.id, name: plan.name, priceEur: plan.priceEur, billing: plan.billing },
    asset: normalizedAsset,
    destination: address,
    quote: {
      denomination: 'EUR',
      amount: plan.priceEur,
      cryptoAmount: null,
      status: 'QUOTE_REQUIRED'
    },
    settlementStatus: 'PENDING',
    accessStatus: 'NOT_ACTIVE',
    requiresIndependentVerification: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
}

module.exports = { PLANS, SUPPORTED_ASSETS, catalog, createCheckoutIntent };
