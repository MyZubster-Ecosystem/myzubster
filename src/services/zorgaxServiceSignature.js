'use strict';

const crypto = require('crypto');

function signatureInput({ method, path, timestamp, nonce, body }) {
  const digest = crypto.createHash('sha256')
    .update(body, 'utf8')
    .digest('hex');

  return [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
    digest
  ].join('\n');
}

function signRequest({ method, path, timestamp, nonce, body, secret }) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('Zorgax service signing secret is not configured securely');
  }

  return crypto.createHmac('sha256', secret)
    .update(signatureInput({ method, path, timestamp, nonce, body }))
    .digest('hex');
}

function verifySignature(input, suppliedSignature) {
  if (typeof suppliedSignature !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(suppliedSignature)) {
    return false;
  }

  const expected = signRequest(input);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(suppliedSignature, 'hex')
  );
}

module.exports = { signRequest, verifySignature };
