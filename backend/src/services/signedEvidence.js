'use strict';

const crypto = require('node:crypto');

function canonicalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new Error('Invalid evidence');
  }

  function sortValue(value) {
    if (Array.isArray(value)) {
      return value.map(sortValue);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map(key => [key, sortValue(value[key])])
      );
    }

    return value;
  }

  return Buffer.from(JSON.stringify(sortValue(evidence)), 'utf8');
}

function nodeIdFromPublicKey(publicKeyPem) {
  const publicKey = crypto.createPublicKey(publicKeyPem);

  if (publicKey.asymmetricKeyType !== 'ed25519') {
    throw new Error('Expected Ed25519 public key');
  }

  const der = publicKey.export({
    type: 'spki',
    format: 'der'
  });

  return 'myzubster:ed25519:' +
    crypto.createHash('sha256').update(der).digest('hex');
}

function verifySignedEvidence({ evidence, publicKeyPem, signatureBase64 }) {
  try {
    if (!evidence || typeof evidence !== 'object' ||
        Array.isArray(evidence) ||
        typeof evidence.node_id !== 'string' ||
        typeof signatureBase64 !== 'string' ||
        !/^[A-Za-z0-9+/]{86}==$/.test(signatureBase64)) {
      return false;
    }

    const expectedNodeId = nodeIdFromPublicKey(publicKeyPem);

    if (evidence.node_id !== expectedNodeId) {
      return false;
    }

    const signature = Buffer.from(signatureBase64, 'base64');

    if (signature.length !== 64) {
      return false;
    }

    return crypto.verify(
      null,
      canonicalizeEvidence(evidence),
      crypto.createPublicKey(publicKeyPem),
      signature
    );
  } catch {
    return false;
  }
}

module.exports = {
  canonicalizeEvidence,
  nodeIdFromPublicKey,
  verifySignedEvidence
};
