'use strict';

const https = require('https');
const ZorgaxSubscription = require('../models/ZorgaxSubscription');
const { PLANS } = require('./zorgaxLegacyMonetizationService');
const { recordVerifiedPayment } = require('./zorgaxSubscriptionService');

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
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

async function createStripeCheckout({ ownerId, planId }) {
  if (!stripeConfigured()) throw new Error('Checkout Stripe Zorgax non configurato');
  const plan = PLANS[String(planId || '').toLowerCase()];
  if (!ownerId || !plan || plan.id === 'free') throw new Error('Piano Zorgax a pagamento non valido');
  const baseUrl = String(process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  const successUrl = process.env.STRIPE_ZORGAX_SUCCESS_URL || (baseUrl ? `${baseUrl}/zorgax?zorgax=success&session_id={CHECKOUT_SESSION_ID}` : '');
  const cancelUrl = process.env.STRIPE_ZORGAX_CANCEL_URL || (baseUrl ? `${baseUrl}/zorgax?zorgax=cancelled` : '');
  if (!successUrl || !cancelUrl) throw new Error('URL checkout Zorgax non configurate');
  const params = {
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(ownerId),
    'line_items[0][quantity]': '1',
    'metadata[userId]': String(ownerId),
    'metadata[plan]': plan.id,
    'metadata[product]': 'zorgax',
    'subscription_data[metadata][userId]': String(ownerId),
    'subscription_data[metadata][plan]': plan.id,
    'subscription_data[metadata][product]': 'zorgax',
    allow_promotion_codes: 'false'
  };
  const priceId = plan.id === 'developer' ? process.env.STRIPE_ZORGAX_DEVELOPER_PRICE_ID : process.env.STRIPE_ZORGAX_PRO_PRICE_ID;
  if (priceId) params['line_items[0][price]'] = priceId;
  else {
    params['line_items[0][price_data][currency]'] = 'eur';
    params['line_items[0][price_data][unit_amount]'] = String(Math.round(plan.priceEur * 100));
    params['line_items[0][price_data][recurring][interval]'] = 'month';
    params['line_items[0][price_data][product_data][name]'] = plan.name;
  }
  const session = await stripeRequest('POST', '/v1/checkout/sessions', params);
  return { checkoutUrl: session.url, sessionId: session.id, plan: { id: plan.id, name: plan.name, priceEur: plan.priceEur } };
}

async function activateZorgaxInvoice(invoice) {
  if (!invoice?.subscription || !invoice?.id || !stripeConfigured()) return null;
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return null;
  const subscription = await stripeRequest('GET', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (subscription.metadata?.product !== 'zorgax') return null;
  if (!['active','trialing'].includes(subscription.status)) return null;
  const ownerId = subscription.metadata?.userId;
  const planId = subscription.metadata?.plan;
  if (!ownerId || !planId) return null;
  const current = await ZorgaxSubscription.findOne({
    ownerId:String(ownerId),
    plan:planId,
    'access.status':'ACTIVE',
    'access.expiresAt':{$gt:new Date()}
  }).sort({'access.expiresAt':-1});
  return recordVerifiedPayment({
    ownerId,
    planId,
    asset:'STRIPE',
    paymentReference:`stripe:invoice:${invoice.id}`,
    verification:{ verified:true, verifier:'stripe-webhook', confirmations:1 },
    renewalOf: current?._id || null
  });
}

module.exports = { stripeConfigured, createStripeCheckout, activateZorgaxInvoice };
