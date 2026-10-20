'use strict';

const crypto = require('crypto');
const { signRequest } = require('./zorgaxServiceSignature');

const GATEWAY_URL = 'https://gateway.myzubster.com/api/zorgax/internal/chat';
const CHAT_PATH = '/api/zorgax/internal/chat';

async function requestZorgaxGateway(payload, {
  fetchFn = global.fetch,
  secret = process.env.ZORGAX_INTERNAL_SIGNING_SECRET
} = {}) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('Zorgax internal signing secret not configured');
  }

  if (typeof fetchFn !== 'function') {
    throw new Error('Zorgax fetch unavailable');
  }

  const message = payload?.message;

  if (typeof message !== 'string' ||
      !message.trim() ||
      message.length > 12000) {
    throw new Error('Invalid Zorgax message');
  }

  const history = payload?.history ?? [];

  if (!Array.isArray(history) ||
      history.length > 12 ||
      history.some(item =>
        !item ||
        typeof item !== 'object' ||
        !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' ||
        item.content.length > 4000
      )) {
    throw new Error('Invalid Zorgax history');
  }

  // Non inoltrare al gateway parametri di policy forniti dal browser.
  const body = JSON.stringify({ message, history });

  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();

  const signature = signRequest({
    method: 'POST',
    path: CHAT_PATH,
    timestamp,
    nonce,
    body,
    secret
  });

  const response = await fetchFn(GATEWAY_URL, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      'X-Zorgax-Timestamp': timestamp,
      'X-Zorgax-Nonce': nonce,
      'X-Zorgax-Signature': signature
    },
    body,
    signal: AbortSignal.timeout(90000)
  });

  if (!response.ok) {
    throw new Error(`Zorgax internal gateway HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result?.ok !== true ||
      typeof result.response !== 'string' ||
      result.privacy?.processing_mode !== 'LOCAL_ONLY' ||
      result.privacy?.external_egress_allowed !== false) {
    throw new Error('Invalid Zorgax internal gateway response');
  }

  return result;
}

module.exports = { requestZorgaxGateway };
