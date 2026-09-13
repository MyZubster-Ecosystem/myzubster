'use strict';

const PaymentIntent = require('../models/PaymentIntent');
const { ZorgaxPurchase, PURCHASE_STATUSES } = require('../models/ZorgaxPurchase');
const { grantPurchaseEntitlement } = require('./zorgaxEntitlementService');
const { quotePlan } = require('./zorgaxQuoteService');
const { verifySettlement } = require('./zorgaxChainVerifierService');
const { PLANS, entitlementForPlan, productIdForPlan, requirePaidPlan } = require('./zorgaxPlanCatalog');

const INTENT_TTL_MS = 15 * 60 * 1000;
const DEFAULT_BTC_WALLET = 'bc1ql0d4hxdqt9cvawx635rwfykxap8juaz94nujl2';
const RETRY_DELAY_MS = 15 * 1000;

function btcWallet() {
  return process.env.ZORGAX_WALLET_BTC || process.env.WALLET_BTC || DEFAULT_BTC_WALLET;
}

function btcToSatoshis(value) {
  const raw = String(value || '').trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(raw)) throw new Error('Importo BTC non valido');
  const [whole, fraction = ''] = raw.split('.');
  const sats = BigInt(whole) * 100000000n + BigInt((fraction + '00000000').slice(0, 8));
  if (sats <= 0n || sats > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Importo BTC fuori intervallo');
  return Number(sats);
}

function satsToBtc(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Importo satoshi non valido');
  const whole = Math.floor(value / 100000000);
  const fraction = String(value % 100000000).padStart(8, '0');
  return `${whole}.${fraction}`;
}

function normalizeTxid(value) {
  const txid = String(value || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txid)) throw new Error('TXID Bitcoin non valido');
  return txid;
}

function markMetadataModified(intent) {
  if (typeof intent?.markModified === 'function') intent.markModified('metadata');
}

function publicIntent(intent) {
  const source = typeof intent?.toObject === 'function' ? intent.toObject() : intent;
  if (!source) return null;
  const z = source.metadata?.zorgax || {};
  const plan = PLANS[z.plan] || { id:z.plan, name:z.plan, priceEur:z.priceEur };
  return {
    intentId:source.intentId,
    purchaseId:z.purchaseId || null,
    plan:{ id:plan.id, name:plan.name, priceEur:plan.priceEur, billing:plan.billing },
    asset:source.asset,
    destination:z.destination || source.destination || null,
    quote:{ denomination:'EUR', amount:z.priceEur, cryptoAmount:z.cryptoAmount || satsToBtc(source.amountMinor), eurPerCoin:z.eurPerCoin, observedAt:z.quoteObservedAt, source:z.quoteSource, status:'QUOTED' },
    settlementStatus:source.status === 'CONFIRMED' ? 'VERIFIED' : source.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING',
    paymentReference:source.txId || null,
    submittedAt:source.submittedAt || null,
    confirmations:z.confirmations ?? null,
    tracking:{ automatic:Boolean(source.txId && source.status !== 'CONFIRMED'), lastCheckedAt:z.lastCheckedAt || null, nextCheckAt:z.nextCheckAt || null, checkAttempts:z.checkAttempts || 0, lastError:z.lastError || null },
    accessStatus:source.status === 'CONFIRMED' ? 'ACTIVE' : 'NOT_ACTIVE',
    renewal:Boolean(z.renew),
    requiresIndependentVerification:true,
    expiresAt:source.expiresAt
  };
}

async function createCheckoutIntent({ ownerId, planId, asset = 'BTC', renew = false }) {
  if (!ownerId) throw new Error('Owner checkout non valido');
  const plan = requirePaidPlan(planId);
  if (String(asset).toUpperCase() !== 'BTC') throw new Error('Solo BTC è operativo per il checkout crypto Zorgax');
  const quote = await quotePlan({ asset:'BTC', priceEur:plan.priceEur });
  const amountMinor = btcToSatoshis(quote.cryptoAmount);
  const crypto = require('crypto');
  const intentId = `zorgax_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const purchaseId = `zpur_${crypto.randomUUID()}`;
  const entitlement = entitlementForPlan(plan.id);
  const destination = btcWallet();
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS);

  const intent = await PaymentIntent.create({
    intentId,
    ownerId:String(ownerId),
    purpose:`zorgax:${productIdForPlan(plan.id)}`,
    asset:'BTC',
    network:'bitcoin',
    amountMinor,
    paymentReference:`zorgaxref_${crypto.randomBytes(16).toString('hex')}`,
    status:'AWAITING_PAYMENT',
    expiresAt,
    metadata:{ zorgax:{ purchaseId, plan:plan.id, priceEur:plan.priceEur, cryptoAmount:quote.cryptoAmount, eurPerCoin:quote.eurPerCoin, quoteObservedAt:quote.observedAt, quoteSource:quote.source, destination, renew:Boolean(renew), confirmations:0, checkAttempts:0 } }
  });

  await ZorgaxPurchase.create({
    purchaseId,
    ownerId:String(ownerId),
    productId:productIdForPlan(plan.id),
    paymentIntentId:intentId,
    creditsGranted:0,
    payment:{ asset:'BTC', network:'bitcoin', amountMinor },
    entitlement,
    status:PURCHASE_STATUSES.PENDING,
    metadata:{ source:'zorgax-unified-checkout', plan:plan.id, priceEur:plan.priceEur, cryptoAmount:quote.cryptoAmount, destination, renew:Boolean(renew) }
  });

  return publicIntent(intent);
}

async function ownedIntent(ownerId, intentId) {
  const intent = await PaymentIntent.findOne({ ownerId:String(ownerId), intentId:String(intentId || ''), purpose:/^zorgax:/ });
  if (!intent) throw new Error('Payment intent non trovato');
  return intent;
}

async function getPaymentIntent({ ownerId, intentId }) {
  const intent = await ownedIntent(ownerId, intentId);
  if (intent.status !== 'CONFIRMED' && !intent.txId && intent.expiresAt <= new Date()) {
    intent.status = 'EXPIRED';
    await intent.save();
  }
  return publicIntent(intent);
}

async function listPaymentIntents({ ownerId, limit = 20 }) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const rows = await PaymentIntent.find({ ownerId:String(ownerId), purpose:/^zorgax:/ }).sort({ createdAt:-1 }).limit(safeLimit).lean();
  return rows.map(publicIntent);
}

async function activate(intent, verification) {
  const purchase = await ZorgaxPurchase.findOne({ ownerId:String(intent.ownerId), paymentIntentId:intent.intentId });
  if (!purchase) throw new Error('Acquisto Zorgax associato non trovato');
  const z = intent.metadata?.zorgax || {};
  const entitlement = purchase.entitlement || entitlementForPlan(z.plan);

  await grantPurchaseEntitlement({
    ownerId:String(intent.ownerId),
    purchaseId:purchase.purchaseId,
    productId:purchase.productId,
    entitlementKey:entitlement.key || 'zorgax.access',
    tier:entitlement.tier,
    durationDays:entitlement.durationDays,
    metadata:{ paymentIntentId:intent.intentId, paymentReference:verification.paymentReference || intent.txId }
  });

  purchase.status = PURCHASE_STATUSES.CREDITED;
  if (!purchase.creditedAt) purchase.creditedAt = new Date();
  await purchase.save();

  intent.status = 'CONFIRMED';
  intent.confirmedAt = new Date();
  intent.metadata = intent.metadata || {};
  intent.metadata.zorgax = { ...z, confirmations:verification.confirmations || 0, lastCheckedAt:new Date(), nextCheckAt:null, lastError:null, verifier:verification.verifier || 'external-payment-verifier' };
  markMetadataModified(intent);
  await intent.save();

  return { intentId:intent.intentId, settlementStatus:'VERIFIED', pending:false, verified:true, plan:z.plan, access:{ status:'ACTIVE' } };
}

function retryable(error) {
  return /Conferme blockchain insufficienti|Pagamento BTC non trovato|Verifier .* non disponibile/i.test(String(error?.message || ''));
}

async function verifyBoundIntent(intent) {
  const z = intent.metadata?.zorgax || {};
  try {
    const verification = await verifySettlement({ asset:'BTC', paymentReference:intent.txId, destination:z.destination, cryptoAmount:z.cryptoAmount || satsToBtc(intent.amountMinor) });
    return activate(intent, verification);
  } catch (error) {
    if (!retryable(error)) throw error;
    intent.metadata = intent.metadata || {};
    intent.metadata.zorgax = { ...z, lastCheckedAt:new Date(), nextCheckAt:new Date(Date.now()+RETRY_DELAY_MS), checkAttempts:Number(z.checkAttempts || 0)+1, lastError:String(error.message).slice(0,300) };
    markMetadataModified(intent);
    await intent.save();
    return { intentId:intent.intentId, settlementStatus:'PENDING', pending:true, automaticMonitoring:true, paymentReference:intent.txId, confirmations:z.confirmations || 0, nextCheckAt:intent.metadata.zorgax.nextCheckAt, message:error.message };
  }
}

async function verifyAndActivatePaymentIntent({ ownerId, intentId, paymentReference }) {
  const intent = await ownedIntent(ownerId, intentId);
  if (intent.status === 'CONFIRMED') return { intentId:intent.intentId, settlementStatus:'VERIFIED', pending:false, verified:true, plan:intent.metadata?.zorgax?.plan };
  if (intent.status === 'EXPIRED') throw new Error('Payment intent scaduto');
  const txid = normalizeTxid(paymentReference);
  if (intent.txId && intent.txId !== txid) throw new Error('Payment intent già associato a un altro TXID');
  if (!intent.txId && intent.expiresAt <= new Date()) {
    intent.status='EXPIRED';
    await intent.save();
    throw new Error('Payment intent scaduto');
  }
  intent.txId = txid;
  intent.status = 'SUBMITTED';
  if (!intent.submittedAt) intent.submittedAt = new Date();
  await intent.save();
  return verifyBoundIntent(intent);
}

async function refreshPaymentIntent({ ownerId, intentId }) {
  const intent = await ownedIntent(ownerId, intentId);
  if (intent.status === 'CONFIRMED') return { intentId:intent.intentId, settlementStatus:'VERIFIED', pending:false, verified:true, plan:intent.metadata?.zorgax?.plan };
  if (!intent.txId) {
    if (intent.expiresAt <= new Date()) {
      intent.status='EXPIRED';
      await intent.save();
      throw new Error('Payment intent scaduto');
    }
    return { intentId:intent.intentId, settlementStatus:'PENDING', pending:true, automaticMonitoring:true, paymentReference:null, message:'TXID non ancora inviato' };
  }
  return verifyBoundIntent(intent);
}

function catalog() {
  return {
    plans:Object.values(PLANS),
    settlement:{
      mode:'non-custodial',
      assets:['BTC'],
      wallets:{ BTC:{ configured:Boolean(btcWallet()), operational:Boolean(btcWallet()), address:btcWallet() } },
      automaticSigning:false,
      privateKeysAccepted:false,
      note:'External settlement must be independently verified before paid access is activated.'
    }
  };
}

module.exports = {
  INTENT_TTL_MS,
  RETRY_DELAY_MS,
  btcToSatoshis,
  btcWallet,
  catalog,
  createCheckoutIntent,
  getPaymentIntent,
  listPaymentIntents,
  markMetadataModified,
  normalizeTxid,
  publicIntent,
  refreshPaymentIntent,
  satsToBtc,
  verifyAndActivatePaymentIntent
};
