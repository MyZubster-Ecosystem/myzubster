'use strict';

const PaymentIntent = require('../models/PaymentIntent');
const {
  ECONOMIC_ENTRY_TYPES,
  ECONOMIC_SOURCE_TYPES,
  ZorgaxEconomicLedgerEntry
} = require('../models/ZorgaxEconomicLedgerEntry');
const {
  normalizeAsset,
  normalizeNetwork,
  recordEconomicEntry,
  requireNonEmptyString
} = require('./zorgaxAccountingService');
const { parseWindowDays } = require('./zorgaxCapitalMetricsService');

const ECOSYSTEM_OWNER_ID = 'myzubster-ecosystem';
const ZORGAX_REVENUE_PURPOSE_PREFIX = 'zorgax:';

function requireConfirmedIntent(intent) {
  if (!intent) throw new Error('PaymentIntent is required');
  if (intent.status !== 'CONFIRMED') throw new Error('PaymentIntent must be CONFIRMED before revenue recognition');
  if (!intent.confirmedAt) throw new Error('confirmed PaymentIntent must have confirmedAt');
  return intent;
}

async function recognizeConfirmedPaymentIntentDocument({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  intent,
  ecosystemOwnerId = ECOSYSTEM_OWNER_ID
}) {
  const confirmed = requireConfirmedIntent(intent);
  const normalizedEcosystemOwnerId = requireNonEmptyString(ecosystemOwnerId, 'ecosystemOwnerId');

  return recordEconomicEntry({
    LedgerModel,
    ownerId: normalizedEcosystemOwnerId,
    type: ECONOMIC_ENTRY_TYPES.REVENUE_RECOGNIZED,
    asset: confirmed.asset,
    network: confirmed.network,
    amountMinor: confirmed.amountMinor,
    sourceType: ECONOMIC_SOURCE_TYPES.PAYMENT_INTENT,
    sourceReference: confirmed.intentId,
    description: `Revenue recognized from confirmed PaymentIntent ${confirmed.intentId}`,
    occurredAt: confirmed.confirmedAt,
    metadata: {
      paymentIntentOwnerId: confirmed.ownerId,
      purpose: confirmed.purpose || null,
      paymentReference: confirmed.paymentReference || null,
      txId: confirmed.txId || null,
      recognitionPolicy: 'confirmed_payment_intent_explicit_v1'
    }
  });
}

async function recognizeConfirmedPaymentIntent({
  PaymentIntentModel = PaymentIntent,
  LedgerModel = ZorgaxEconomicLedgerEntry,
  intentId,
  ecosystemOwnerId = ECOSYSTEM_OWNER_ID
}) {
  if (!PaymentIntentModel || typeof PaymentIntentModel.findOne !== 'function') {
    throw new Error('PaymentIntentModel is required');
  }

  const normalizedIntentId = requireNonEmptyString(intentId, 'intentId');
  const intent = await PaymentIntentModel.findOne({ intentId: normalizedIntentId });
  if (!intent) throw new Error('PaymentIntent not found');

  return recognizeConfirmedPaymentIntentDocument({
    LedgerModel,
    intent,
    ecosystemOwnerId
  });
}

async function syncConfirmedPaymentIntents({
  PaymentIntentModel = PaymentIntent,
  LedgerModel = ZorgaxEconomicLedgerEntry,
  asset,
  network = null,
  windowDays = 30,
  now = new Date(),
  ecosystemOwnerId = ECOSYSTEM_OWNER_ID
}) {
  if (!PaymentIntentModel || typeof PaymentIntentModel.find !== 'function') {
    throw new Error('PaymentIntentModel is required');
  }

  const normalizedAsset = normalizeAsset(asset);
  const normalizedNetwork = normalizeNetwork(network);
  const normalizedWindowDays = parseWindowDays(windowDays);
  const until = new Date(now);
  if (Number.isNaN(until.getTime())) throw new Error('now must be a valid date');
  const since = new Date(until.getTime() - (normalizedWindowDays * 24 * 60 * 60 * 1000));

  const filter = {
    status: 'CONFIRMED',
    asset: normalizedAsset,
    purpose: { $regex: '^zorgax:' },
    confirmedAt: { $gte: since, $lte: until }
  };
  if (normalizedNetwork) filter.network = normalizedNetwork;

  const intents = await PaymentIntentModel.find(filter)
    .select('intentId ownerId purpose asset network amountMinor paymentReference txId status confirmedAt')
    .sort({ confirmedAt: 1, createdAt: 1 })
    .lean();

  const entries = [];
  for (const intent of intents) {
    entries.push(await recognizeConfirmedPaymentIntentDocument({
      LedgerModel,
      intent,
      ecosystemOwnerId
    }));
  }

  return {
    asset: normalizedAsset,
    network: normalizedNetwork,
    windowDays: normalizedWindowDays,
    since,
    until,
    confirmedIntentCount: intents.length,
    recognizedEntryCount: entries.length,
    entries,
    purposePrefix: ZORGAX_REVENUE_PURPOSE_PREFIX,
    recognitionPolicy: 'zorgax_confirmed_payment_intent_revenue_v1',
    caveat: 'This sync recognizes only confirmed Zorgax monetization PaymentIntents as operational revenue. It is not statutory or tax accounting.'
  };
}

module.exports = {
  ECOSYSTEM_OWNER_ID,
  ZORGAX_REVENUE_PURPOSE_PREFIX,
  recognizeConfirmedPaymentIntent,
  recognizeConfirmedPaymentIntentDocument,
  requireConfirmedIntent,
  syncConfirmedPaymentIntents
};
