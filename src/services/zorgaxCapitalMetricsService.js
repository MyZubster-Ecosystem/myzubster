'use strict';

const PaymentIntent = require('../models/PaymentIntent');
const { requireSafeNonNegativeInteger } = require('./zorgaxCapitalAllocatorService');

function requireNonEmptyString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function parseWindowDays(value, fallback = 30) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 366) {
    throw new Error('windowDays must be an integer between 1 and 366');
  }
  return parsed;
}

async function getConfirmedInflowSnapshot({
  PaymentIntentModel,
  asset,
  network = null,
  windowDays = 30,
  now = new Date()
}) {
  if (!PaymentIntentModel || typeof PaymentIntentModel.find !== 'function') {
    throw new Error('PaymentIntentModel is required');
  }

  const normalizedAsset = requireNonEmptyString(asset, 'asset').toUpperCase();
  const normalizedNetwork = network ? String(network).trim() : null;
  const days = parseWindowDays(windowDays);
  const until = new Date(now);
  const since = new Date(until.getTime() - (days * 24 * 60 * 60 * 1000));

  if (!PaymentIntent.PAYMENT_INTENT_STATES.includes('CONFIRMED')) {
    throw new Error('CONFIRMED payment intent state is not available');
  }

  const filter = {
    status: 'CONFIRMED',
    asset: normalizedAsset,
    confirmedAt: { $gte: since, $lte: until }
  };

  if (normalizedNetwork) filter.network = normalizedNetwork;

  const intents = await PaymentIntentModel.find(filter)
    .select('amountMinor asset network confirmedAt intentId')
    .lean();

  let confirmedRevenueMinor = 0;
  for (const intent of intents) {
    const amountMinor = requireSafeNonNegativeInteger(intent.amountMinor, 'PaymentIntent.amountMinor');
    const next = confirmedRevenueMinor + amountMinor;
    if (!Number.isSafeInteger(next)) throw new Error('confirmed revenue exceeds safe integer range');
    confirmedRevenueMinor = next;
  }

  return {
    asset: normalizedAsset,
    network: normalizedNetwork,
    windowDays: days,
    since,
    until,
    confirmedIntentCount: intents.length,
    confirmedRevenueMinor,
    accountingBasis: 'confirmed_payment_intents',
    caveat: 'Confirmed inflow is not audited accounting profit; expenses, obligations and reserves are applied separately.'
  };
}

module.exports = {
  getConfirmedInflowSnapshot,
  parseWindowDays,
  requireNonEmptyString
};
