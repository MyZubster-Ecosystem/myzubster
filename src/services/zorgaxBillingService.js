'use strict';

const PaymentIntent = require('../models/PaymentIntent');
const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const ZorgaxSubscription = require('../models/ZorgaxSubscription');
const { ZorgaxPurchase } = require('../models/ZorgaxPurchase');
const { listEntitlements } = require('./zorgaxEntitlementService');

function receiptId(intentId) {
  return `zorgax-receipt-${String(intentId || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

async function getPaymentReceipt({ ownerId, intentId }) {
  const legacyQuery = ZorgaxPaymentIntent.findOne({
    ownerId:String(ownerId),
    intentId:String(intentId || ''),
    'settlement.status':'VERIFIED'
  });
  const legacy = typeof legacyQuery?.lean === 'function' ? await legacyQuery.lean() : await legacyQuery;
  if (legacy) {
    const subscriptionQuery = ZorgaxSubscription.findOne({ ownerId:String(ownerId) });
    const subscription = typeof subscriptionQuery?.lean === 'function' ? await subscriptionQuery.lean() : await subscriptionQuery;
    return {
      receiptId:receiptId(legacy.intentId),
      documentType:'PAYMENT_RECEIPT',
      fiscalInvoice:false,
      entity:'ZORGAX-001',
      intentId:legacy.intentId,
      plan:legacy.plan,
      payment:{
        asset:legacy.asset,
        destination:legacy.destination || null,
        paymentReference:legacy.settlement?.paymentReference || null,
        cryptoAmount:legacy.quote?.cryptoAmount || null,
        amountEur:legacy.quote?.amount ?? null,
        quoteSource:legacy.quote?.source || null,
        quoteObservedAt:legacy.quote?.observedAt || null,
        confirmations:legacy.settlement?.confirmations ?? null,
        verifiedAt:legacy.settlement?.verifiedAt || legacy.updatedAt || null,
        verifier:legacy.settlement?.verifier || null
      },
      access:{
        status:subscription?.access?.status || 'ACTIVE',
        startsAt:subscription?.access?.startsAt || legacy.settlement?.verifiedAt || legacy.updatedAt || null,
        expiresAt:subscription?.access?.expiresAt || null,
        renewal:Boolean(subscription?.renewalOf)
      },
      issuedAt:legacy.settlement?.verifiedAt || legacy.updatedAt || null,
      note:'Ricevuta tecnica di pagamento non-custodial. Non costituisce fattura fiscale.'
    };
  }

  const intent = await PaymentIntent.findOne({
    ownerId:String(ownerId),
    intentId:String(intentId || ''),
    status:'CONFIRMED',
    purpose:/^zorgax:/
  }).lean();
  if (!intent) throw new Error('Ricevuta pagamento non trovata');

  const purchase = await ZorgaxPurchase.findOne({ ownerId:String(ownerId), paymentIntentId:intent.intentId, status:'CREDITED' }).lean();
  if (!purchase) throw new Error('Acquisto associato alla ricevuta non trovato');

  const entitlements = await listEntitlements({ ownerId:String(ownerId), includeInactive:true });
  const entitlement = entitlements.find(entry => entry.sourcePurchaseId === purchase.purchaseId) || null;
  const z = intent.metadata?.zorgax || {};

  return {
    receiptId:receiptId(intent.intentId),
    documentType:'PAYMENT_RECEIPT',
    fiscalInvoice:false,
    entity:'ZORGAX-001',
    intentId:intent.intentId,
    plan:z.plan || String(purchase.entitlement?.tier || '').toLowerCase(),
    payment:{
      asset:intent.asset,
      destination:z.destination || intent.destination || null,
      paymentReference:intent.txId,
      cryptoAmount:z.cryptoAmount || null,
      amountEur:z.priceEur ?? null,
      quoteSource:z.quoteSource || null,
      quoteObservedAt:z.quoteObservedAt || null,
      confirmations:z.confirmations ?? null,
      verifiedAt:intent.confirmedAt,
      verifier:z.verifier || null
    },
    access:{
      status:entitlement?.status || 'ACTIVE',
      startsAt:entitlement?.startsAt || purchase.creditedAt,
      expiresAt:entitlement?.endsAt || null,
      renewal:Boolean(z.renew)
    },
    issuedAt:intent.confirmedAt || purchase.creditedAt || intent.updatedAt,
    note:'Ricevuta tecnica di pagamento non-custodial. Non costituisce fattura fiscale.'
  };
}

module.exports = { getPaymentReceipt, receiptId };
