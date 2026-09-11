'use strict';

const https = require('https');
const crypto = require('crypto');

const MIN_AMOUNT_CENTS = 100;
const MAX_AMOUNT_CENTS = 100000;

function configured() { return Boolean(process.env.STRIPE_SECRET_KEY); }

function validate(input = {}) {
  const amount = Number(input.amountCents);
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT_CENTS || amount > MAX_AMOUNT_CENTS) {
    throw new Error(`amountCents must be an integer between ${MIN_AMOUNT_CENTS} and ${MAX_AMOUNT_CENTS}`);
  }
  const currency = String(input.currency || 'eur').toLowerCase();
  if (currency !== 'eur') throw new Error('Only EUR is allowed for Payment Dashboard checkout');
  const description = String(input.description || 'MyZubster payment').trim().slice(0, 120);
  return { amountCents: amount, currency, description };
}

function parseStripeResponse(res, resolve, reject) {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', c => { data += c; });
  res.on('end', () => {
    let parsed;
    try { parsed = data ? JSON.parse(data) : {}; }
    catch (_) { return reject(new Error('Invalid Stripe response')); }
    if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(parsed?.error?.message || `Stripe HTTP ${res.statusCode}`));
    resolve(parsed);
  });
}

function stripePost(path, params, idempotencyKey) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request({ hostname:'api.stripe.com', port:443, path, method:'POST', headers:{
      Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type':'application/x-www-form-urlencoded',
      'Content-Length':Buffer.byteLength(body),
      'Idempotency-Key':idempotencyKey
    }}, res => parseStripeResponse(res, resolve, reject));
    req.on('error', reject); req.write(body); req.end();
  });
}

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname:'api.stripe.com', port:443, path, method:'GET', headers:{
      Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
      Accept:'application/json'
    }}, res => parseStripeResponse(res, resolve, reject));
    req.on('error', reject); req.end();
  });
}

async function createControlledCheckout({ input, actor, idempotencyKey }) {
  if (!configured()) throw new Error('STRIPE_SECRET_KEY is not configured');
  const safe = validate(input);
  const key = String(idempotencyKey || '').trim();
  if (key.length < 12 || key.length > 200) throw new Error('A valid Idempotency-Key is required');
  const baseUrl = String(process.env.PUBLIC_APP_URL || 'https://www.myzubster.com').replace(/\/$/, '');
  const actorId = String(actor?.github || actor?.username || actor?.login || actor?.userId || 'admin').slice(0,100);
  const requestHash = crypto.createHash('sha256').update(`${safe.amountCents}|${safe.currency}|${safe.description}|${actorId}`).digest('hex');
  const params = {
    mode:'payment', success_url:`${baseUrl}/payment-dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${baseUrl}/payment-dashboard?checkout=cancelled`,
    'line_items[0][quantity]':'1',
    'line_items[0][price_data][currency]':safe.currency,
    'line_items[0][price_data][unit_amount]':String(safe.amountCents),
    'line_items[0][price_data][product_data][name]':safe.description,
    'metadata[source]':'payment-dashboard', 'metadata[actor]':actorId, 'metadata[request_hash]':requestHash
  };
  const session = await stripePost('/v1/checkout/sessions', params, key);
  return { sessionId:session.id, checkoutUrl:session.url, amountCents:safe.amountCents, currency:safe.currency, requestHash, actor:actorId };
}

async function verifyControlledCheckout(sessionId) {
  if (!configured()) throw new Error('STRIPE_SECRET_KEY is not configured');
  const id = String(sessionId || '').trim();
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) throw new Error('Invalid Checkout Session ID');
  const session = await stripeGet(`/v1/checkout/sessions/${encodeURIComponent(id)}?expand[]=payment_intent`);
  if (session?.metadata?.source !== 'payment-dashboard') throw new Error('Checkout Session does not belong to Payment Dashboard');
  const paymentIntent = session?.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  return {
    sessionId: session.id,
    status: session.status || null,
    paymentStatus: session.payment_status || null,
    paid: session.payment_status === 'paid',
    amountTotal: Number(session.amount_total || 0),
    currency: String(session.currency || '').toLowerCase() || null,
    customerEmail: session.customer_details?.email || session.customer_email || null,
    paymentIntentId: paymentIntent?.id || (typeof session.payment_intent === 'string' ? session.payment_intent : null),
    paymentIntentStatus: paymentIntent?.status || null,
    actor: session.metadata?.actor || null,
    requestHash: session.metadata?.request_hash || null,
    livemode: session.livemode === true,
    createdAt: session.created ? new Date(session.created * 1000).toISOString() : null
  };
}

module.exports = { configured, validate, createControlledCheckout, verifyControlledCheckout, MIN_AMOUNT_CENTS, MAX_AMOUNT_CENTS };
