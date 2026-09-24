'use strict';

const PaymentIntent = require('../models/PaymentIntent');
const { ZorgaxPurchase } = require('../models/ZorgaxPurchase');
const { listEntitlements } = require('./zorgaxEntitlementService');

function receiptId(intentId) {
  return `zorgax-receipt-${String(intentId || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

async function getPaymentReceipt({ ownerId, intentId }) {
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
