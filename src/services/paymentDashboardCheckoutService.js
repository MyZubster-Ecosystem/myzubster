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

function stripePost(path, params, idempotencyKey) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request({ hostname:'api.stripe.com', port:443, path, method:'POST', headers:{
      Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type':'application/x-www-form-urlencoded',
      'Content-Length':Buffer.byteLength(body),
      'Idempotency-Key':idempotencyKey
    }}, res => {
      let data=''; res.setEncoding('utf8'); res.on('data', c => { data += c; });
      res.on('end', () => {
        let parsed; try { parsed = data ? JSON.parse(data) : {}; } catch (_) { return reject(new Error('Invalid Stripe response')); }
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(parsed?.error?.message || `Stripe HTTP ${res.statusCode}`));
        resolve(parsed);
      });
    });
    req.on('error', reject); req.write(body); req.end();
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
  // Audit evidence is stored in Stripe metadata; no card data or secret is logged locally.
  return { sessionId:session.id, checkoutUrl:session.url, amountCents:safe.amountCents, currency:safe.currency, requestHash, actor:actorId };
}

module.exports = { configured, validate, createControlledCheckout, MIN_AMOUNT_CENTS, MAX_AMOUNT_CENTS };
