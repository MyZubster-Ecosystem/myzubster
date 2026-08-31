'use strict';

const ZorgaxPaymentIntent = require('../models/ZorgaxPaymentIntent');
const ZorgaxSubscription = require('../models/ZorgaxSubscription');

function receiptId(intentId) {
  return `zorgax-receipt-${String(intentId || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

async function getPaymentReceipt({ ownerId, intentId }) {
  const intent = await ZorgaxPaymentIntent.findOne({
    ownerId: String(ownerId),
    intentId: String(intentId || ''),
    'settlement.status': 'VERIFIED'
  }).lean();

  if (!intent) throw new Error('Ricevuta pagamento non trovata');

  const subscription = await ZorgaxSubscription.findOne({
    ownerId: String(ownerId),
    paymentReference: intent.settlement.paymentReference
  }).lean();

  if (!subscription) throw new Error('Accesso associato alla ricevuta non trovato');

  return {
    receiptId: receiptId(intent.intentId),
    documentType: 'PAYMENT_RECEIPT',
    fiscalInvoice: false,
    entity: 'ZORGAX-001',
    intentId: intent.intentId,
    plan: intent.plan,
    payment: {
      asset: intent.asset,
      destination: intent.destination,
      paymentReference: intent.settlement.paymentReference,
      cryptoAmount: intent.quote.cryptoAmount,
      amountEur: intent.quote.amount,
      quoteSource: intent.quote.source,
      quoteObservedAt: intent.quote.observedAt,
      confirmations: intent.settlement.confirmations,
      verifiedAt: intent.settlement.verifiedAt,
      verifier: intent.settlement.verifier
    },
    access: {
      status: subscription.access.status,
      startsAt: subscription.access.startsAt,
      expiresAt: subscription.access.expiresAt,
      renewal: Boolean(subscription.renewalOf)
    },
    issuedAt: intent.settlement.verifiedAt || intent.updatedAt,
    note: 'Ricevuta tecnica di pagamento non-custodial. Non costituisce fattura fiscale.'
  };
}

module.exports = {
  getPaymentReceipt,
  receiptId
};
