const express = require('express');
const crypto = require('crypto');
const https = require('https');
const SellerMembership = require('../models/SellerMembership');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const monthlyPrice = () => Math.max(0, Number(process.env.MARKETPLACE_SELLER_MONTHLY_EUR || 9.90));

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

function requireModerator(req, res, next) {
  if (!['admin', 'moderator'].includes(req.userRole)) return res.status(403).json({ success:false, message:'Permessi insufficienti' });
  next();
}

function plan() {
  return {
    id: 'SELLER_MONTHLY',
    name: 'MyZubster Seller',
    amount: monthlyPrice(),
    currency: 'EUR',
    interval: 'month',
    benefits: ['pubblicazione annunci', 'gestione stock', 'richieste e messaggistica privata', 'reputazione da scambi completati'],
    paymentStatus: stripeConfigured() ? 'stripe_checkout_available' : 'external_verification_required'
  };
}

function stripeRequest(method, path, params) {
  return new Promise((resolve, reject) => {
    const body = params ? new URLSearchParams(params).toString() : '';
    const request = https.request({
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...(body ? {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        } : {})
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
          return reject(new Error(parsed?.error?.message || `Stripe HTTP ${response.statusCode}`));
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
  const expected = crypto
    .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody.toString('utf8')}`, 'utf8')
    .digest('hex');
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  });
}

function stripePeriodEnd(subscription) {
  return subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
}

function membershipStatusFromStripe(subscription) {
  const status = subscription?.status;
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'canceled') return 'CANCELLED';
  if (status === 'incomplete_expired') return 'EXPIRED';
  if (['past_due', 'unpaid', 'paused'].includes(status)) return 'SUSPENDED';
  return 'PENDING_PAYMENT';
}

async function syncStripeSubscription(subscription, eventId, fallbackUserId) {
  if (!subscription?.id) return null;
  const userId = subscription.metadata?.userId || fallbackUserId;
  const selector = userId ? { userId } : { stripeSubscriptionId:subscription.id };
  const status = membershipStatusFromStripe(subscription);
  const now = new Date();
  const update = {
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

router.get('/plan', (_req, res) => res.json({ success:true, plan:plan() }));

router.get('/me', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId }).lean();
    const active = Boolean(membership && membership.status === 'ACTIVE' && membership.expiresAt && membership.expiresAt > new Date());
    res.json({ success:true, active, membership, plan:plan(), stripeConfigured:stripeConfigured() });
  } catch (_error) { res.status(500).json({ success:false, message:'Stato Seller non disponibile' }); }
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const amount = monthlyPrice();
    const billingReference = `SELLER-${crypto.randomUUID()}`;
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.userId },
      { $set:{ plan:'SELLER_MONTHLY', status:'PENDING_PAYMENT', priceAmount:amount, priceCurrency:'EUR', billingReference, paymentReference:'', paymentProvider:'MANUAL', verifiedBy:null, verifiedAt:null } },
      { new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true }
    );
    res.status(201).json({
      success:true,
      membership,
      plan:plan(),
      paymentRequired:true,
      stripeCheckoutAvailable:stripeConfigured(),
      message:'Richiesta Seller creata. L’account si attiva solo dopo verifica reale del pagamento; questa API non simula né conferma pagamenti.'
    });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Richiesta Seller non creata' }); }
});

router.post('/checkout', authenticate, async (req, res) => {
  if (!stripeConfigured()) return res.status(503).json({ success:false, message:'Checkout Stripe non configurato' });
  const baseUrl = String(process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  const successUrl = process.env.STRIPE_SELLER_SUCCESS_URL || (baseUrl ? `${baseUrl}/marketplace?seller=success&session_id={CHECKOUT_SESSION_ID}` : '');
  const cancelUrl = process.env.STRIPE_SELLER_CANCEL_URL || (baseUrl ? `${baseUrl}/marketplace?seller=cancelled` : '');
  if (!successUrl || !cancelUrl) return res.status(503).json({ success:false, message:'URL checkout Seller non configurate' });
  try {
    const amount = monthlyPrice();
    const billingReference = `SELLER-${crypto.randomUUID()}`;
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.userId },
      { $set:{
        plan:'SELLER_MONTHLY', status:'PENDING_PAYMENT', priceAmount:amount, priceCurrency:'EUR', billingReference,
        paymentReference:'', paymentProvider:'STRIPE',
        verifiedBy:null, verifiedAt:null
      } },
      { new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true }
    );
    const params = {
      mode:'subscription',
      success_url:successUrl,
      cancel_url:cancelUrl,
      client_reference_id:String(req.userId),
      'line_items[0][quantity]':'1',
      'metadata[userId]':String(req.userId),
      'metadata[billingReference]':billingReference,
      'subscription_data[metadata][userId]':String(req.userId),
      'subscription_data[metadata][billingReference]':billingReference,
      allow_promotion_codes:'false'
    };
    if (process.env.STRIPE_SELLER_PRICE_ID) {
      params['line_items[0][price]'] = process.env.STRIPE_SELLER_PRICE_ID;
    } else {
      params['line_items[0][price_data][currency]'] = 'eur';
      params['line_items[0][price_data][unit_amount]'] = String(Math.round(amount * 100));
      params['line_items[0][price_data][recurring][interval]'] = 'month';
      params['line_items[0][price_data][product_data][name]'] = 'MyZubster Seller';
    }
    if (membership.stripeCustomerId) params.customer = membership.stripeCustomerId;
    const session = await stripeRequest('POST', '/v1/checkout/sessions', params);
    membership.stripeCheckoutSessionId = session.id;
    if (typeof session.customer === 'string') membership.stripeCustomerId = session.customer;
    await membership.save();
    res.status(201).json({ success:true, checkoutUrl:session.url, sessionId:session.id, membership, plan:plan() });
  } catch (error) {
    res.status(502).json({ success:false, message:error.message || 'Checkout Stripe non disponibile' });
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
      const userId = object.metadata?.userId || object.client_reference_id;
      if (object.subscription) {
        const subscription = await stripeRequest('GET', `/v1/subscriptions/${encodeURIComponent(object.subscription)}`);
        await syncStripeSubscription(subscription, event.id, userId);
      }
      await SellerMembership.findOneAndUpdate(
        { userId },
        { $set:{
          paymentProvider:'STRIPE',
          stripeCheckoutSessionId:object.id,
          stripeCustomerId:typeof object.customer === 'string' ? object.customer : undefined,
          stripeLastEventId:event.id
        } },
        { new:true }
      );
    } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncStripeSubscription(object, event.id);
    } else if (event.type === 'invoice.paid' && object.subscription) {
      const subscription = await stripeRequest('GET', `/v1/subscriptions/${encodeURIComponent(object.subscription)}`);
      await syncStripeSubscription(subscription, event.id);
    } else if (event.type === 'invoice.payment_failed' && object.subscription) {
      await SellerMembership.findOneAndUpdate(
        { stripeSubscriptionId:object.subscription },
        { $set:{ status:'SUSPENDED', stripeSubscriptionStatus:'payment_failed', stripeLastEventId:event.id } },
        { new:true }
      );
    }
    res.json({ received:true });
  } catch (error) {
    console.error('Stripe Seller webhook error:', error.message);
    res.status(500).json({ success:false, message:'Webhook Stripe non elaborato' });
  }
});

router.post('/cancel', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId });
    if (!membership) return res.status(404).json({ success:false, message:'Account Seller non trovato' });
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
  } catch (_error) { res.status(400).json({ success:false, message:'Impossibile annullare il piano Seller' }); }
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
    const expiresAt = new Date(now); expiresAt.setMonth(expiresAt.getMonth() + 1);
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.params.userId, status:'PENDING_PAYMENT' },
      { $set:{ status:'ACTIVE', paymentProvider:'MANUAL', paymentReference, verifiedBy:req.userId, verifiedAt:now, startsAt:now, expiresAt } },
      { new:true, runValidators:true }
    );
    if (!membership) return res.status(404).json({ success:false, message:'Richiesta Seller in attesa non trovata' });
    res.json({ success:true, membership, revenueRecorded:{ amount:membership.priceAmount, currency:membership.priceCurrency, basis:'payment_verified_by_authorized_moderator' } });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Account Seller non attivato' }); }
});

module.exports = router;
