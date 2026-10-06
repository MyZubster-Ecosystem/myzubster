'use strict';

const https = require('https');

function configured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function request(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = body ? JSON.parse(body) : {}; }
        catch (_error) { return reject(new Error('Invalid Stripe response')); }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(parsed?.error?.message || `Stripe HTTP ${res.statusCode}`));
        }
        resolve(parsed);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function normalizeCharge(charge) {
  const amount = Number(charge?.amount || 0) / 100;
  const refunded = Number(charge?.amount_refunded || 0) / 100;
  let status = 'INCOMING';
  if (charge?.status === 'succeeded' && charge?.paid === true && charge?.refunded !== true) status = 'SETTLED';
  else if (charge?.status === 'succeeded') status = 'CONFIRMED';
  else if (charge?.failure_code || charge?.status === 'failed') status = 'FAILED';
  return {
    reference: charge?.id || null,
    txId: charge?.balance_transaction || null,
    asset: String(charge?.currency || '').toUpperCase() || null,
    amount: amount - refunded,
    status,
    timestamp: charge?.created ? new Date(charge.created * 1000).toISOString() : null,
    provider: 'stripe',
    livemode: charge?.livemode === true,
    metadata: charge?.metadata || {}
  };
}

async function stripeFundingInputsProvider() {
  if (!configured()) {
    return {
      configured: false,
      reason: 'STRIPE_SECRET_KEY is not configured.',
      items: [],
      totals: { incoming: null, confirmed: null, settled: null }
    };
  }
  const limit = Math.min(Math.max(Number(process.env.PAYMENT_DASHBOARD_STRIPE_LIMIT || 25), 1), 100);
  const payload = await request(`/v1/charges?limit=${limit}`);
  const items = Array.isArray(payload?.data) ? payload.data.map(normalizeCharge) : [];
  return { configured: true, provider: 'stripe-readonly', items };
}

module.exports = { configured, normalizeCharge, stripeFundingInputsProvider };
