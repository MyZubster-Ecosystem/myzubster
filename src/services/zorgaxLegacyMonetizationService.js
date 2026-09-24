'use strict';

const { PLANS } = require('./zorgaxPlanCatalog');
const { SUPPORTED_ASSETS } = require('./zorgaxAssetCatalog');
module.exports.SUPPORTED_ASSETS = SUPPORTED_ASSETS;
const unified = require('./zorgaxUnifiedCheckoutService');
const crypto = require('crypto');
const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const ZorgaxSubscription = require('../models/ZorgaxSubscription');
const { quotePlan } = require('./zorgaxQuoteService');
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

async function createCheckoutIntent({ ownerId, planId, asset = 'BTC', renew = false }) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('Owner checkout non valido');
  const plan = PLANS[String(planId || '').toLowerCase()];
  if (!plan || plan.id === 'free') throw new Error('Piano Zorgax non valido');

  const normalizedAsset = String(asset || 'BTC').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset crypto Zorgax non supportato');
  const destination = normalizedAsset === 'ETH' ? unified.ethWallet() : unified.btcWallet();
  if (!destination) throw new Error(`Wallet ${normalizedAsset} non configurato`);

  const quote = await quotePlan({ asset:normalizedAsset, priceEur:plan.priceEur });
  let renewalOf = null;
  if (renew) {
    const active = await ZorgaxSubscription.findOne({
      ownerId: normalizedOwnerId,
      plan: plan.id,
      'access.status':'ACTIVE'
    }).sort({ createdAt:-1 });
    renewalOf = active?._id ? String(active._id) : null;
  }

  const intentId = `zorgax_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS);
  const document = {
    intentId,
    ownerId: String(ownerId),
    plan: plan.id,
    asset: normalizedAsset,
    destination,
    renewalOf,
    quote: {
      denomination:'EUR',
      amount:plan.priceEur,
      cryptoAmount: String(quote.cryptoAmount),
      eurPerCoin:quote.eurPerCoin,
      observedAt:quote.observedAt,
      source:quote.source,
      status:'QUOTED'
    },
    settlement:{ status:'PENDING' },
    expiresAt
  };
  const created = await ZorgaxPaymentIntent.create(document);
  return publicLegacyIntent(created);
}

function publicLegacyIntent(intent) {
  const source = typeof intent?.toObject === 'function' ? intent.toObject() : intent;
  if (!source) return null;
  return {
    intentId:source.intentId,
    plan:source.plan,
    asset:source.asset,
    destination:source.destination,
    quote:source.quote,
    settlementStatus:source.settlement?.status || 'PENDING',
    paymentReference:source.settlement?.paymentReference || null,
    submittedAt:source.settlement?.submittedAt || null,
    confirmations:source.settlement?.confirmations ?? null,
    tracking:{
      automatic:Boolean(source.settlement?.paymentReference && source.settlement?.status !== 'VERIFIED'),
      lastCheckedAt:source.settlement?.lastCheckedAt || null,
      nextCheckAt:source.settlement?.nextCheckAt || null,
      checkAttempts:source.settlement?.checkAttempts || 0,
      lastError:source.settlement?.lastError || null
    },
    accessStatus:source.settlement?.status === 'VERIFIED' ? 'ACTIVE' : 'NOT_ACTIVE',
    renewal:Boolean(source.renewalOf),
    requiresIndependentVerification:true,
    expiresAt:source.expiresAt
  };
}

async function getPaymentIntent({ ownerId, intentId }) {
  const query = ZorgaxPaymentIntent.findOne({ intentId:String(intentId || ''), ownerId:String(ownerId) });
  const legacy = typeof query?.lean === 'function' ? await query.lean() : await query;
  if (legacy) {
    if (legacy.settlement?.status !== 'VERIFIED' && !legacy.settlement?.paymentReference && legacy.expiresAt <= new Date()) {
      await ZorgaxPaymentIntent.updateOne(
        { intentId:legacy.intentId, ownerId:String(ownerId), 'settlement.status':'PENDING' },
        { $set:{ 'settlement.status':'EXPIRED' } }
      );
      legacy.settlement = { ...(legacy.settlement || {}), status:'EXPIRED' };
    }
    return publicLegacyIntent(legacy);
  }
  throw new Error('Payment intent non trovato');
}

async function listPaymentIntents({ ownerId, limit = 20 }) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const query = ZorgaxPaymentIntent.find({ ownerId:String(ownerId) }).sort({ createdAt:-1 }).limit(safeLimit);
  const legacy = typeof query?.lean === 'function' ? await query.lean() : await query;
  return Array.isArray(legacy) ? legacy.map(publicLegacyIntent) : [];
}

module.exports = {
  PLANS,
  SUPPORTED_ASSETS,
  INTENT_TTL_MS,
  DEFAULT_BTC_WALLET,
  publicWallets,
  isSettlementRailOperational,
  catalog: unified.catalog,
  createCheckoutIntent,
  getPaymentIntent,
  listPaymentIntents,
  publicIntent: unified.publicIntent,
  publicLegacyIntent
};
