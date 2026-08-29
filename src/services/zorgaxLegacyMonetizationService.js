'use strict';

const crypto = require('crypto');
const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');

const PLANS = Object.freeze({
  free: { id: 'free', name: 'Zorgax Free', priceEur: 0, billing: 'free', features: ['assistant-base', 'limited-research'] },
  pro: { id: 'pro', name: 'Zorgax Pro', priceEur: 9.90, billing: 'monthly-equivalent', features: ['assistant-advanced', 'web-research', 'workspace', 'priority-usage'] },
  developer: { id: 'developer', name: 'Zorgax Developer', priceEur: 29.90, billing: 'monthly-equivalent', features: ['pro', 'api-access', 'automation', 'higher-limits'] }
});

const SUPPORTED_ASSETS = Object.freeze(['ETH', 'BTC', 'XMR', 'TARI']);
const INTENT_TTL_MS = 15 * 60 * 1000;
const DEFAULT_BTC_WALLET = 'bc1ql0d4hxdqt9cvawx635rwfykxap8juaz94nujl2';

function publicWallets() {
  return {
    ETH: process.env.ZORGAX_WALLET_ETH || process.env.WALLET_ETH || '',
    BTC: process.env.ZORGAX_WALLET_BTC || process.env.WALLET_BTC || DEFAULT_BTC_WALLET,
    XMR: process.env.ZORGAX_WALLET_XMR || process.env.WALLET_XMR || '',
    TARI: process.env.ZORGAX_WALLET_TARI || process.env.WALLET_TARI || ''
  };
}

function isSettlementRailOperational(asset) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) return false;
  if (!publicWallets()[normalizedAsset]) return false;
  if (normalizedAsset === 'BTC') return true;
  return Boolean(
    process.env.ZORGAX_QUOTE_API_URL &&
    process.env[`ZORGAX_${normalizedAsset}_VERIFIER_URL`] &&
    process.env[`ZORGAX_${normalizedAsset}_VERIFIER_TOKEN`]
  );
}

function catalog() {
  const wallets = publicWallets();
  return {
    plans: Object.values(PLANS),
    settlement: {
      mode: 'non-custodial',
      assets: SUPPORTED_ASSETS.filter(isSettlementRailOperational),
      wallets: Object.fromEntries(Object.entries(wallets).map(([asset, address]) => [asset, {
        configured: Boolean(address),
        operational: isSettlementRailOperational(asset),
        address
      }])),
      automaticSigning: false,
      privateKeysAccepted: false,
      note: 'External settlement must be independently verified before paid access is activated.'
    }
  };
}

function publicIntent(doc, plan) {
  return {
    intentId: doc.intentId,
    plan: { id: plan.id, name: plan.name, priceEur: plan.priceEur, billing: plan.billing },
    asset: doc.asset,
    destination: doc.destination,
    quote: {
      denomination: doc.quote.denomination,
      amount: doc.quote.amount,
      cryptoAmount: doc.quote.cryptoAmount,
      eurPerCoin: doc.quote.eurPerCoin,
      observedAt: doc.quote.observedAt,
      source: doc.quote.source,
      status: doc.quote.status
    },
    settlementStatus: doc.settlement.status,
    accessStatus: 'NOT_ACTIVE',
    requiresIndependentVerification: true,
    expiresAt: doc.expiresAt
  };
}

async function createCheckoutIntent({ ownerId, planId, asset }) {
  if (!ownerId) throw new Error('Owner checkout non valido');
  const plan = PLANS[String(planId || '').toLowerCase()];
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!plan || plan.id === 'free') throw new Error('Piano a pagamento non valido');
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset di pagamento non supportato');
  if (!isSettlementRailOperational(normalizedAsset)) throw new Error(`Rail di pagamento ${normalizedAsset} non operativo`);
  const address = publicWallets()[normalizedAsset];

  const { quotePlan } = require('./zorgaxQuoteService');
  const quote = await quotePlan({ asset: normalizedAsset, priceEur: plan.priceEur });
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS);
  const intent = await ZorgaxPaymentIntent.create({
    intentId: `zorgax_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    ownerId: String(ownerId),
    plan: plan.id,
    asset: normalizedAsset,
    destination: address,
    quote: {
      denomination: 'EUR',
      amount: plan.priceEur,
      cryptoAmount: String(quote.cryptoAmount),
      eurPerCoin: quote.eurPerCoin,
      observedAt: quote.observedAt,
      source: quote.source,
      status: 'QUOTED'
    },
    settlement: { status: 'PENDING' },
    expiresAt
  });

  return publicIntent(intent, plan);
}

async function getPaymentIntent({ ownerId, intentId }) {
  const intent = await ZorgaxPaymentIntent.findOne({ intentId: String(intentId || ''), ownerId: String(ownerId) }).lean();
  if (!intent) throw new Error('Payment intent non trovato');
  if (intent.settlement.status === 'PENDING' && intent.expiresAt <= new Date()) {
    await ZorgaxPaymentIntent.updateOne({ _id: intent._id, 'settlement.status': 'PENDING' }, { $set: { 'settlement.status': 'EXPIRED' } });
    intent.settlement.status = 'EXPIRED';
  }
  return publicIntent(intent, PLANS[intent.plan]);
}

module.exports = {
  PLANS,
  SUPPORTED_ASSETS,
  INTENT_TTL_MS,
  DEFAULT_BTC_WALLET,
  publicWallets,
  isSettlementRailOperational,
  catalog,
  createCheckoutIntent,
  getPaymentIntent
};
