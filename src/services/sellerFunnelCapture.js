'use strict';
// MYZ-1615: optional best-effort PostHog capture, disabled unless explicitly configured.
// Delivery is not durable; a DB-backed outbox is required for exactly-once reporting.
const https = require('https');
const crypto = require('crypto');
const { buildSellerEvent } = require('./sellerFunnelEvents');

function publicationInsertId(event, listingId) {
  if (event !== 'marketplace_listing_published' || !/^[a-f0-9]{24}$/i.test(String(listingId || ''))) throw new Error('Valid persisted listing ID required');
  return crypto.createHash('sha256').update('myz:v1:' + event + ':' + String(listingId)).digest('hex');
}

function captureSellerEvent(event, userId, properties = {}, { env = process.env, transport = https, listingId } = {}) {
  const key = env.POSTHOG_PROJECT_API_KEY;
  const secret = env.SELLER_FUNNEL_PSEUDONYM_SECRET;
  const host = env.POSTHOG_CAPTURE_HOST;
  if (!key || !secret || !host) return Promise.resolve({ skipped: true });
  let url;
  try { url = new URL(host); } catch (_e) { return Promise.resolve({ skipped: true }); }
  // Restrict destinations to HTTPS and a configured allowlist to prevent SSRF.
  const allowed = new Set(['us.i.posthog.com', 'eu.i.posthog.com']);
  if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    return Promise.resolve({ skipped: true });
  }
  let payload;
  try {
    payload = buildSellerEvent({ event, userId, secret, properties: { ...properties, environment: env.SELLER_FUNNEL_ENV || 'staging' } });
  } catch (_e) { return Promise.resolve({ skipped: true }); }
  // PostHog can deduplicate repeated delivery of this publication event via $insert_id.
  // This is not a durable outbox or an exactly-once guarantee.
  if (event === 'marketplace_listing_published') {
    try { payload.properties.$insert_id = publicationInsertId(event, listingId); }
    catch (_e) { return Promise.resolve({ skipped: true }); }
  }
  const data = JSON.stringify({ api_key: key, ...payload });
  return new Promise(resolve => {
    const request = transport.request({
      hostname: url.hostname, path: '/capture/', port: 443, method: 'POST',
      timeout: 2500, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, response => {
      response.resume();
      response.on('end', () => resolve({ delivered: response.statusCode >= 200 && response.statusCode < 300 }));
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve({ delivered: false }));
    request.end(data);
  });
}

module.exports = { captureSellerEvent, publicationInsertId };
