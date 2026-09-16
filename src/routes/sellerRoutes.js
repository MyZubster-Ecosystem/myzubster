const express = require('express');
const crypto = require('crypto');
const https = require('https');
const SellerMembership = require('../models/SellerMembership');
const { authenticate } = require('../middleware/auth');
const { activateZorgaxInvoice } = require('../services/zorgaxStripeService');
const { logConversionEvent } = require('../services/conversionFunnel');
const {
  freeSellerPlan,
  isFreeSellerActive,
  requiresPaymentOnboarding,
  calculatePlatformCommission
} = require('../services/freeSellerPolicy');

const router = express.Router();

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

function requireModerator(req, res, next) {
  if (!['admin', 'moderator'].includes(req.userRole)) return res.status(403).json({ success:false, message:'Permessi insufficienti' });
  next();
}

function stripeRequest(method, path, params) {
  return new Promise((resolve, reject) => {
    const body = params ? new URLSearchParams(params).toString() : '';
    const request = https.request({
      hostname: 'api.stripe.com', port: 443, path, method,
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...(body ? { 'Content-Type':'application/x-www-form-urlencoded', 'Content-Length':Buffer.byteLength(body) } : {})
      }
    }, response => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let parsed;
        try { parsed = data ? JSON.parse(data) : {}; }
        catch (_error) { return reject(new Error('Risposta Stripe non valida')); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed?.error?.message || `Stripe HTTP ${response.statusCode}`);
          error.statusCode = response.statusCode;
          error.stripeCode = parsed?.error?.code;
          error.stripeParam = parsed?.error?.param;
          return reject(error);
        }
        resolve(parsed);
      });
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!Buffer.isBuffer(rawBody) || !signatureHeader || !process.env.STRIPE_WEBHOOK_SECRET) return false;
  const parts = String(signatureHeader).split(',').map(part => part.trim());
  const timestampPart = parts.find(part => part.startsWith('t='));
  const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3));
  if (!timestampPart || !signatures.length) return false;
  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${reqBodyToString(rawBody)}`, 'utf8').digest('hex');
  return signatures.some(signature => /^[a-f0-9]{64}$/i.test(signature) && crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex')));
}

function reqBodyToString(rawBody) {
  return rawBody.toString('utf8');
}

function stripePeriodEnd(subscription) {
  const timestamp = subscription?.current_period_end || subscription?.items?.data?.[0]?.current_period_end;
  return timestamp ? new Date(timestamp * 1000) : null;
}

function membershipStatusFromStripe(subscription) {
  const status = subscription?.status;
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'canceled') return 'CANCELLED';
  if (status === 'incomplete_expired') return 'EXPIRED';
  if (['past_due', 'unpaid', 'paused'].includes(status)) return 'SUSPENDED';
  return 'PENDING_PAYMENT';
}

async function syncLegacyStripeSubscription(subscription, eventId, fallbackUserId) {
  if (!subscription?.id || subscription.metadata?.product === 'zorgax') return null;
  const userId = subscription.metadata?.userId || fallbackUserId;
  const selector = userId ? { userId } : { stripeSubscriptionId:subscription.id };
  const status = membershipStatusFromStripe(subscription);
  const now = new Date();
  const update = {
    plan:'SELLER_MONTHLY',
    paymentProvider:'STRIPE',
    stripeSubscriptionId:subscription.id,
    stripeCustomerId:typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripePriceId:subscription.items?.data?.[0]?.price?.id || process.env.STRIPE_SELLER_PRICE_ID,
    stripeSubscriptionStatus:subscription.status,
    stripeLastEventId:eventId,
    status,
    expiresAt:stripePeriodEnd(subscription)
  };
  if (status === 'ACTIVE') {
    update.verifiedAt = now;
    update.startsAt = subscription.start_date ? new Date(subscription.start_date * 1000) : now;
    update.paymentReference = subscription.id;
  }
  if (status === 'CANCELLED') update.cancelledAt = now;
  return SellerMembership.findOneAndUpdate(selector, { $set:update }, { new:true, runValidators:true });
}

function membershipIsActive(membership) {
  if (!membership) return false;
  if (isFreeSellerActive(membership)) return true;
  if (membership.plan === 'SELLER_MONTHLY' && membership.status === 'ACTIVE') {
    return !membership.expiresAt || membership.expiresAt > new Date();
  }
  return false;
}

async function activateFreeSeller(userId) {
  const existing = await SellerMembership.findOne({ userId });
  if (existing?.plan === 'SELLER_MONTHLY' && membershipIsActive(existing) && existing.stripeSubscriptionId) {
    return { membership: existing, preservedLegacyPaidState:true };
  }
  const membership = await SellerMembership.findOneAndUpdate(
    { userId },
    { $set:{
      plan:'SELLER_FREE',
      status:'ACTIVE',
      priceAmount:0,
      priceCurrency:'EUR',
      paymentProvider:'NONE',
      billingReference:'',
      paymentReference:'',
      verifiedBy:null,
      verifiedAt:null,
      startsAt:existing?.startsAt || new Date(),
      expiresAt:null,
      cancelledAt:null
    } },
    { new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true }
  );
  return { membership, preservedLegacyPaidState:false };
}

router.get('/plan', (_req, res) => res.json({ success:true, plan:freeSellerPlan() }));

router.get('/me', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId }).lean();
    const active = membershipIsActive(membership);
    const sellerCanReceiveFunds = Boolean(membership?.paymentProvider === 'STRIPE' && membership?.verifiedAt);
    res.json({
      success:true,
      active,
      membership,
      plan:freeSellerPlan(),
      stripeConfigured:stripeConfigured(),
      sellerCanReceiveFunds,
      paymentOnboarding:requiresPaymentOnboarding({ sellerCanReceiveFunds })
    });
  } catch (_error) {
    res.status(500).json({ success:false, message:'Stato Seller non disponibile' });
  }
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { membership, preservedLegacyPaidState } = await activateFreeSeller(req.userId);
    logConversionEvent('seller_free_activated', {
      userId:req.userId,
      path:req.originalUrl,
      provider:'NONE',
      plan:membership.plan,
      amount:0,
      currency:'EUR',
      metadata:{ preservedLegacyPaidState }
    });
    res.status(201).json({
      success:true,
      active:true,
      membership,
      plan:freeSellerPlan(),
      paymentRequired:false,
      paymentMethodRequired:false,
      message:'Seller attivato gratis. Pubblica gratis; il pagamento viene configurato solo quando inizi a guadagnare.'
    });
  } catch (error) {
    res.status(400).json({ success:false, message:error.message || 'Account Seller non attivato' });
  }
});

router.post('/checkout', authenticate, async (_req, res) => {
  res.status(409).json({
    success:false,
    code:'SELLER_CHECKOUT_NOT_REQUIRED',
    paymentRequired:false,
    plan:freeSellerPlan(),
    message:'Per diventare Seller non serve pagare. Attiva prima SELLER_FREE; l’onboarding pagamenti viene richiesto al primo incasso reale.'
  });
});

router.post('/payment-readiness', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId }).lean();
    if (!membershipIsActive(membership)) return res.status(403).json({ success:false, message:'Attiva prima il profilo Seller gratuito' });
    const isPaidTransaction = req.body?.isPaidTransaction === true;
    const payoutRequested = req.body?.payoutRequested === true;
    const sellerCanReceiveFunds = Boolean(membership?.paymentProvider === 'STRIPE' && membership?.verifiedAt);
    const paymentOnboarding = requiresPaymentOnboarding({ isPaidTransaction, payoutRequested, sellerCanReceiveFunds });
    const grossAmount = req.body?.grossAmount;
    let commission = null;
    if (grossAmount != null && isPaidTransaction) commission = calculatePlatformCommission(grossAmount);
    logConversionEvent(paymentOnboarding.required ? 'seller_payment_onboarding_required' : 'seller_payment_readiness_checked', {
      userId:req.userId,
      path:req.originalUrl,
      provider:membership.paymentProvider || 'NONE',
      plan:membership.plan,
      amount:grossAmount == null ? null : Number(grossAmount),
      currency:'EUR',
      metadata:{ payoutRequested, isPaidTransaction, commission }
    });
    res.json({ success:true, paymentOnboarding, commission, currency:'EUR', plan:freeSellerPlan() });
  } catch (error) {
    res.status(400).json({ success:false, message:error.message || 'Stato monetizzazione non disponibile' });
  }
});

router.post('/webhook', async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ success:false, message:'Webhook Stripe non configurato' });
  const signature = req.headers['stripe-signature'];
  if (!verifyStripeSignature(req.body, signature)) return res.status(400).json({ success:false, message:'Firma webhook Stripe non valida' });
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); }
  catch (_error) { return res.status(400).json({ success:false, message:'Payload webhook non valido' }); }

  try {
    const object = event?.data?.object || {};
    if (event.type === 'checkout.session.completed' && object.mode === 'subscription') {
      if (object.metadata?.product === 'zorgax') return res.json({ received:true, product:'zorgax' });
      const userId = object.metadata?.userId || object.client_reference_id;
      if (object.subscription) {
        const subscription = await stripeRequest('GET', `/v1/subscriptions/${encodeURIComponent(object.subscription)}`);
        await syncLegacyStripeSubscription(subscription, event.id, userId);
      }
      await SellerMembership.findOneAndUpdate({ userId }, { $set:{
        stripeCheckoutSessionId:object.id,
        stripeCustomerId:typeof object.customer === 'string' ? object.customer : undefined,
        stripeLastEventId:event.id
      } }, { new:true });
    } else if (['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)) {
      if (object.metadata?.product === 'zorgax') return res.json({ received:true, product:'zorgax' });
      await syncLegacyStripeSubscription(object, event.id);
    } else if (event.type === 'invoice.paid' && object.subscription) {
      const zorgaxSubscription = await activateZorgaxInvoice(object);
      if (zorgaxSubscription) return res.json({ received:true, product:'zorgax', activated:true, plan:zorgaxSubscription.plan });
      const subscription = await stripeRequest('GET', `/v1/subscriptions/${encodeURIComponent(object.subscription)}`);
      const membership = await syncLegacyStripeSubscription(subscription, event.id);
      if (membership) logConversionEvent('seller_legacy_payment_succeeded', {
        userId:membership.userId,
        path:'/api/marketplace/seller/webhook',
        provider:'STRIPE',
        plan:'SELLER_MONTHLY',
        amount:Number(object.amount_paid || 0) / 100,
        currency:String(object.currency || 'EUR').toUpperCase()
      });
    } else if (event.type === 'invoice.payment_failed' && object.subscription) {
      const membership = await SellerMembership.findOneAndUpdate(
        { stripeSubscriptionId:object.subscription },
        { $set:{ status:'SUSPENDED', stripeSubscriptionStatus:'payment_failed', stripeLastEventId:event.id } },
        { new:true }
      );
      if (membership) logConversionEvent('seller_legacy_payment_failed', {
        userId:membership.userId,
        path:'/api/marketplace/seller/webhook',
        provider:'STRIPE',
        plan:'SELLER_MONTHLY',
        amount:Number(object.amount_due || 0) / 100,
        currency:String(object.currency || 'EUR').toUpperCase()
      });
    }
    res.json({ received:true });
  } catch (error) {
    console.error('Stripe Seller/Zorgax webhook error:', error.message);
    res.status(500).json({ success:false, message:'Webhook Stripe non elaborato' });
  }
});

router.post('/cancel', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId });
    if (!membership) return res.status(404).json({ success:false, message:'Account Seller non trovato' });
    if (membership.plan === 'SELLER_FREE') {
      return res.json({ success:true, membership, cancellation:'not_applicable', message:'SELLER_FREE non ha rinnovi a pagamento da annullare' });
    }
    const now = new Date();
    if (membership.paymentProvider === 'STRIPE' && membership.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      const subscription = await stripeRequest('POST', `/v1/subscriptions/${encodeURIComponent(membership.stripeSubscriptionId)}`, { cancel_at_period_end:'true' });
      membership.cancelledAt = now;
      membership.stripeSubscriptionStatus = subscription.status;
      membership.expiresAt = stripePeriodEnd(subscription) || membership.expiresAt;
      await membership.save();
      return res.json({ success:true, membership, cancellation:'at_period_end' });
    }
    membership.status = 'CANCELLED';
    membership.cancelledAt = now;
    await membership.save();
    res.json({ success:true, membership, cancellation:'immediate' });
  } catch (_error) {
    res.status(400).json({ success:false, message:'Impossibile annullare il piano Seller' });
  }
});

router.get('/moderation/pending', authenticate, requireModerator, async (_req, res) => {
  const memberships = await SellerMembership.find({ status:'PENDING_PAYMENT' }).sort({ createdAt:1 }).limit(200).lean();
  res.json({ success:true, memberships });
});

router.patch('/moderation/:userId/activate', authenticate, requireModerator, async (req, res) => {
  try {
    const paymentReference = String(req.body?.paymentReference || '').trim();
    if (!paymentReference || paymentReference.length < 4 || paymentReference.length > 300) return res.status(400).json({ success:false, message:'Riferimento pagamento verificato obbligatorio' });
    const now = new Date();
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.params.userId, status:'PENDING_PAYMENT' },
      { $set:{ status:'ACTIVE', paymentProvider:'MANUAL', paymentReference, verifiedBy:req.userId, verifiedAt:now, startsAt:now } },
      { new:true, runValidators:true }
    );
    if (!membership) return res.status(404).json({ success:false, message:'Richiesta Seller in attesa non trovata' });
    res.json({ success:true, membership });
  } catch (error) {
    res.status(400).json({ success:false, message:error.message || 'Account Seller non attivato' });
  }
});

module.exports = router;
