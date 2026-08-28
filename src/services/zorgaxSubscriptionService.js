'use strict';

const ZorgaxSubscription = require('../models/ZorgaxSubscription');
const { PLANS, SUPPORTED_ASSETS } = require('./zorgaxMonetizationService');

const ACCESS_DAYS = 30;

function normalizePaymentReference(value) {
  const ref = String(value || '').trim();
  if (!ref || ref.length > 180) throw new Error('Riferimento pagamento non valido');
  return ref;
}

async function recordVerifiedPayment({ ownerId, planId, asset, paymentReference, verification, renewalOf }) {
  const plan = PLANS[String(planId || '').toLowerCase()];
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!plan || plan.id === 'free') throw new Error('Piano a pagamento non valido');
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  if (!verification || verification.verified !== true) {
    throw new Error('Pagamento non verificato: accesso non attivabile');
  }

  const ref = normalizePaymentReference(paymentReference);
  const existing = await ZorgaxSubscription.findOne({ paymentReference: ref }).lean();
  if (existing) throw new Error('Pagamento già utilizzato');

  const now = new Date();
  let startsAt = now;
  let renewalDoc = null;
  if (renewalOf) {
    renewalDoc = await ZorgaxSubscription.findOne({ _id: renewalOf, ownerId: String(ownerId) });
    if (!renewalDoc) throw new Error('Abbonamento da rinnovare non trovato');
    if (renewalDoc.access?.expiresAt && renewalDoc.access.expiresAt > now) startsAt = renewalDoc.access.expiresAt;
  }
  const expiresAt = new Date(startsAt.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

  const subscription = await ZorgaxSubscription.create({
    ownerId: String(ownerId),
    plan: plan.id,
    asset: normalizedAsset,
    paymentReference: ref,
    verification: {
      status: 'VERIFIED',
      verifier: String(verification.verifier || 'external-chain-verifier').slice(0, 120),
      verifiedAt: now
    },
    access: { status: 'ACTIVE', startsAt, expiresAt },
    renewalOf: renewalDoc?._id || null
  });

  return subscription;
}

async function getAccess(ownerId) {
  const now = new Date();
  await ZorgaxSubscription.updateMany(
    { ownerId: String(ownerId), 'access.status': 'ACTIVE', 'access.expiresAt': { $lte: now } },
    { $set: { 'access.status': 'EXPIRED' } }
  );
  const active = await ZorgaxSubscription.findOne({
    ownerId: String(ownerId),
    'access.status': 'ACTIVE',
    'access.startsAt': { $lte: now },
    'access.expiresAt': { $gt: now }
  }).sort({ 'access.expiresAt': -1 }).lean();

  if (!active) return { plan: 'free', status: 'ACTIVE', expiresAt: null };
  return { id: String(active._id), plan: active.plan, status: active.access.status, startsAt: active.access.startsAt, expiresAt: active.access.expiresAt };
}

module.exports = { ACCESS_DAYS, recordVerifiedPayment, getAccess };
