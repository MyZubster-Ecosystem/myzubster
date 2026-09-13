'use strict';

const https = require('https');
const { PLANS } = require('./zorgaxPlanCatalog');
const { recordVerifiedPayment } = require('./zorgaxSubscriptionService');

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeRequest(method, path, params) {
  return new Promise((resolve, reject) => {
    const body = params ? new URLSearchParams(params).toString() : '';
    const request = https.request({
      hostname:'api.stripe.com', port:443, path, method,
      headers:{
        Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...(body ? { 'Content-Type':'application/x-www-form-urlencoded', 'Content-Length':Buffer.byteLength(body) } : {})
      }
    }, response => {
      let data='';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let parsed;
        try { parsed=data ? JSON.parse(data) : {}; }
        catch (_error) { return reject(new Error('Risposta Stripe non valida')); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error=new Error(parsed?.error?.message || `Stripe HTTP ${response.statusCode}`);
          error.statusCode=response.statusCode;
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

function subscriptionPeriod(subscription) {
  const items = Array.isArray(subscription?.items?.data) ? subscription.items.data : [];
  const starts = [
    subscription?.current_period_start,
    ...items.map(item => item?.current_period_start)
  ].filter(Number.isFinite);
  const ends = [
    subscription?.current_period_end,
    ...items.map(item => item?.current_period_end)
  ].filter(Number.isFinite);

  return {
    startsAt: starts.length ? new Date(Math.min(...starts) * 1000) : null,
    endsAt: ends.length ? new Date(Math.max(...ends) * 1000) : null
  };
}

async function findActiveZorgaxSubscriptionForOwner(ownerId, { now = new Date() } = {}) {
  if (!stripeConfigured()) return null;
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!/^[A-Za-z0-9:_-]{1,200}$/.test(normalizedOwnerId)) return null;

  const query = `metadata['userId']:'${normalizedOwnerId}' AND metadata['product']:'zorgax'`;
  const response = await stripeRequest(
    'GET',
    `/v1/subscriptions/search?limit=20&query=${encodeURIComponent(query)}`
  );

  const candidates = (Array.isArray(response?.data) ? response.data : [])
    .filter(subscription => ['active', 'trialing'].includes(subscription?.status))
    .map(subscription => {
      const planId = String(subscription?.metadata?.plan || '').toLowerCase();
      const period = subscriptionPeriod(subscription);
      return { subscription, planId, ...period };
    })
    .filter(entry => ['pro', 'developer'].includes(entry.planId))
    .filter(entry => entry.endsAt && entry.endsAt > now)
    .sort((left, right) => right.endsAt - left.endsAt);

  if (!candidates.length) return null;
  const match = candidates[0];
  return {
    subscriptionId: match.subscription.id,
    ownerId: normalizedOwnerId,
    planId: match.planId,
    status: match.subscription.status,
    startsAt: match.startsAt || now,
    endsAt: match.endsAt,
    cancelAtPeriodEnd: match.subscription.cancel_at_period_end === true
  };
}

async function createStripeCheckout({ ownerId, planId }) {
  if (!stripeConfigured()) throw new Error('Checkout Stripe Zorgax non configurato');
  const plan=PLANS[String(planId || '').toLowerCase()];
  if (!ownerId || !plan || plan.id === 'free') throw new Error('Piano Zorgax a pagamento non valido');
  const baseUrl=String(process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  const successUrl=process.env.STRIPE_ZORGAX_SUCCESS_URL || (baseUrl ? `${baseUrl}/zorgax?zorgax=success&session_id={CHECKOUT_SESSION_ID}` : '');
  const cancelUrl=process.env.STRIPE_ZORGAX_CANCEL_URL || (baseUrl ? `${baseUrl}/zorgax?zorgax=cancelled` : '');
  if (!successUrl || !cancelUrl) throw new Error('URL checkout Zorgax non configurate');
  const params={
    mode:'subscription', success_url:successUrl, cancel_url:cancelUrl,
    client_reference_id:String(ownerId),
    'line_items[0][quantity]':'1',
    'metadata[userId]':String(ownerId), 'metadata[plan]':plan.id, 'metadata[product]':'zorgax',
    'subscription_data[metadata][userId]':String(ownerId), 'subscription_data[metadata][plan]':plan.id, 'subscription_data[metadata][product]':'zorgax',
    allow_promotion_codes:'false'
  };
  const priceId=plan.id === 'developer' ? process.env.STRIPE_ZORGAX_DEVELOPER_PRICE_ID : process.env.STRIPE_ZORGAX_PRO_PRICE_ID;
  if (priceId) params['line_items[0][price]']=priceId;
  else {
    params['line_items[0][price_data][currency]']='eur';
    params['line_items[0][price_data][unit_amount]']=String(Math.round(plan.priceEur * 100));
    params['line_items[0][price_data][recurring][interval]']='month';
    params['line_items[0][price_data][product_data][name]']=plan.name;
  }
  const session=await stripeRequest('POST','/v1/checkout/sessions',params);
  return { checkoutUrl:session.url, sessionId:session.id, plan:{ id:plan.id, name:plan.name, priceEur:plan.priceEur } };
}

async function activateZorgaxInvoice(invoice) {
  if (!invoice?.subscription || !invoice?.id || !stripeConfigured()) return null;
  const subscriptionId=typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return null;
  const subscription=await stripeRequest('GET',`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (subscription.metadata?.product !== 'zorgax') return null;
  if (!['active','trialing'].includes(subscription.status)) return null;
  const ownerId=subscription.metadata?.userId;
  const planId=subscription.metadata?.plan;
  if (!ownerId || !planId) return null;
  return recordVerifiedPayment({
    ownerId,
    planId,
    asset:'STRIPE',
    paymentReference:`stripe:invoice:${invoice.id}`,
    verification:{ verified:true, verifier:'stripe-webhook', confirmations:1 }
  });
}

module.exports = {
  stripeConfigured,
  stripeRequest,
  subscriptionPeriod,
  findActiveZorgaxSubscriptionForOwner,
  createStripeCheckout,
  activateZorgaxInvoice
};
