'use strict';

const https = require('https');

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    }, response => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (_error) {
          return reject(new Error('Risposta Stripe non valida'));
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed?.error?.message || `Stripe HTTP ${response.statusCode}`);
          error.statusCode = response.statusCode;
          return reject(error);
        }
        resolve(parsed);
      });
    });
    request.on('error', reject);
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

async function findActiveZorgaxStripeSubscription(ownerId, { now = new Date() } = {}) {
  if (!stripeConfigured()) return null;

  const normalizedOwnerId = String(ownerId || '').trim();
  if (!/^[A-Za-z0-9:_-]{1,200}$/.test(normalizedOwnerId)) return null;

  const query = `metadata['userId']:'${normalizedOwnerId}' AND metadata['product']:'zorgax'`;
  const result = await stripeGet(`/v1/subscriptions/search?limit=20&query=${encodeURIComponent(query)}`);

  const matches = (Array.isArray(result?.data) ? result.data : [])
    .filter(subscription => ['active', 'trialing'].includes(subscription?.status))
    .map(subscription => {
      const plan = String(subscription?.metadata?.plan || '').trim().toLowerCase();
      const period = subscriptionPeriod(subscription);
      return { subscription, plan, ...period };
    })
    .filter(entry => ['pro', 'developer'].includes(entry.plan))
    .filter(entry => entry.endsAt && entry.endsAt > now)
    .sort((left, right) => right.endsAt - left.endsAt);

  if (!matches.length) return null;
  const match = matches[0];

  return {
    subscriptionId: match.subscription.id,
    plan: match.plan,
    status: match.subscription.status,
    startsAt: match.startsAt || now,
    endsAt: match.endsAt,
    cancelAtPeriodEnd: match.subscription.cancel_at_period_end === true
  };
}

module.exports = {
  findActiveZorgaxStripeSubscription,
  stripeConfigured,
  stripeGet,
  subscriptionPeriod
};
