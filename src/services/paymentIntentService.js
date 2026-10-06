const crypto = require('crypto');
const { randomUUID } = require('crypto');
const PaymentIntent = require('../models/PaymentIntent');

const DEFAULT_TTL_MS = 30 * 60 * 1000;

function normalizeAsset(value) {
  return String(value || '').trim().toUpperCase();
}

function requireSafePositiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }

  return value;
}

function paymentReference() {
  return crypto.randomBytes(24).toString('hex');
}

async function createPaymentIntent({
  ownerId,
  purpose,
  asset,
  network,
  amountMinor,
  metadata = {},
  ttlMs = DEFAULT_TTL_MS
}) {
  if (!ownerId) {
    throw new Error('ownerId is required');
  }

  if (!purpose) {
    throw new Error('purpose is required');
  }

  if (!network) {
    throw new Error('network is required');
  }

  const normalizedAsset = normalizeAsset(asset);

  if (!normalizedAsset) {
    throw new Error('asset is required');
  }

  requireSafePositiveInteger(amountMinor, 'amountMinor');
  requireSafePositiveInteger(ttlMs, 'ttlMs');

  return PaymentIntent.create({
    intentId: randomUUID(),
    ownerId: String(ownerId),
    purpose: String(purpose),
    asset: normalizedAsset,
    network: String(network),
    amountMinor,
    paymentReference: paymentReference(),
    status: 'PENDING',
    expiresAt: new Date(Date.now() + ttlMs),
    metadata
  });
}

async function allocateDestination({
  intentId,
  destination
}) {
  if (!destination) {
    throw new Error('destination is required');
  }

  const intent = await PaymentIntent.findOne({ intentId });

  if (!intent) {
    throw new Error('payment intent not found');
  }

  if (intent.status !== 'PENDING') {
    throw new Error(
      `destination cannot be allocated from state ${intent.status}`
    );
  }

  if (intent.expiresAt <= new Date()) {
    intent.status = 'EXPIRED';
    await intent.save();

    throw new Error('payment intent expired');
  }

  intent.destination = String(destination).trim();
  intent.status = 'AWAITING_PAYMENT';

  return intent.save();
}

async function recordTransaction({
  intentId,
  txId
}) {
  if (!txId) {
    throw new Error('txId is required');
  }

  const intent = await PaymentIntent.findOne({ intentId });

  if (!intent) {
    throw new Error('payment intent not found');
  }

  if (intent.status === 'CONFIRMED') {
    if (intent.txId === txId) {
      return {
        intent,
        replay: true
      };
    }

    throw new Error(
      'confirmed payment intent cannot be rebound to another transaction'
    );
  }

  if (
    !['AWAITING_PAYMENT', 'SUBMITTED', 'FAILED'].includes(intent.status)
  ) {
    throw new Error(
      `transaction cannot be recorded from state ${intent.status}`
    );
  }

  if (intent.txId && intent.txId !== txId) {
    throw new Error(
      'payment intent already bound to another transaction'
    );
  }

  intent.txId = String(txId).trim();
  intent.status = 'SUBMITTED';

  if (!intent.submittedAt) {
    intent.submittedAt = new Date();
  }

  await intent.save();

  return {
    intent,
    replay: false
  };
}

function verificationMatchesIntent(intent, verification) {
  if (!verification || verification.verified !== true) {
    return false;
  }

  return (
    verification.txId === intent.txId &&
    verification.destination === intent.destination &&
    normalizeAsset(verification.asset) === intent.asset &&
    String(verification.network) === intent.network &&
    Number.isSafeInteger(verification.amountMinor) &&
    verification.amountMinor >= intent.amountMinor &&
    verification.confirmed === true
  );
}

async function confirmPaymentIntent({
  intentId,
  verification
}) {
  const intent = await PaymentIntent.findOne({ intentId });

  if (!intent) {
    throw new Error('payment intent not found');
  }

  if (intent.status === 'CONFIRMED') {
    if (verification?.txId === intent.txId) {
      return {
        intent,
        replay: true
      };
    }

    throw new Error(
      'confirmed payment intent cannot be rebound to another transaction'
    );
  }

  if (intent.status !== 'SUBMITTED') {
    throw new Error(
      `payment cannot be confirmed from state ${intent.status}`
    );
  }

  if (!verificationMatchesIntent(intent, verification)) {
    intent.failureReason =
      'payment verification did not match intent';

    await intent.save();

    throw new Error(
      'payment verification did not match intent'
    );
  }

  intent.status = 'CONFIRMED';
  intent.confirmedAt = new Date();
  intent.failureReason = null;

  await intent.save();

  return {
    intent,
    replay: false
  };
}

module.exports = {
  DEFAULT_TTL_MS,
  allocateDestination,
  confirmPaymentIntent,
  createPaymentIntent,
  normalizeAsset,
  recordTransaction,
  requireSafePositiveInteger,
  verificationMatchesIntent
};
