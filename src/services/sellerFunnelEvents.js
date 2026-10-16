'use strict';

// MYZ-1615: privacy-safe event builder. This module does not send network requests.
// Integrate only after durable transition/idempotency handling is implemented.
const crypto = require('crypto');

const EVENTS = new Set([
  'seller_activated',
  'marketplace_listing_published',
  'marketplace_inquiry_created',
  'marketplace_exchange_completed'
]);
const ENVIRONMENTS = new Set(['development', 'test', 'staging', 'production']);
const SAFE_KEY = /^[a-z][a-z0-9_]*$/;
const SAFE_VALUE = /^[a-zA-Z0-9_-]{1,80}$/;
const ALLOWED = new Set(['schema_version', 'environment', 'seller_plan', 'listing_category', 'currency', 'source']);

function pseudonym(userId, secret) {
  if (!userId || !secret || String(secret).length < 32) throw new Error('Pseudonymization secret and actor required');
  return crypto.createHmac('sha256', secret).update(String(userId)).digest('hex');
}

function buildSellerEvent({ event, userId, secret, properties = {} }) {
  if (!EVENTS.has(event)) throw new Error('Unsupported seller event');
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) throw new Error('Invalid properties');
  const keys = Object.keys(properties);
  if (keys.some(key => !SAFE_KEY.test(key) || !ALLOWED.has(key))) throw new Error('Unsafe event property');
  if (properties.environment && !ENVIRONMENTS.has(properties.environment)) throw new Error('Invalid environment');
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'schema_version') {
      if (value !== 1) throw new Error('Unsupported schema version');
    } else if (typeof value !== 'string' || !SAFE_VALUE.test(value)) {
      throw new Error('Unsafe event value');
    }
  }
  return {
    event,
    distinct_id: pseudonym(userId, secret),
    properties: { ...properties, schema_version: 1 }
  };
}

module.exports = { buildSellerEvent, pseudonym };
