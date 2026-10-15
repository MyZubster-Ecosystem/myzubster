'use strict';

const {
  verifySignedEvidence
} = require('./signedEvidence');

const {
  validateFederationEvidence
} = require('./federationEvidenceValidator');

const FederationReplayNonce =
  require('../models/FederationReplayNonce');

const MAX_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_MS = 60 * 1000;
const NONCE_RETENTION_MS = 10 * 60 * 1000;

async function acceptFederatedEvidence({
  evidence,
  publicKeyPem,
  signatureBase64
}) {
  if (!validateFederationEvidence(evidence)) {
    return { accepted: false, reason: 'invalid_evidence' };
  }

  if (typeof evidence.timestamp !== 'string' ||
      typeof evidence.nonce !== 'string' ||
      !/^[a-f0-9]{32}$/.test(evidence.nonce)) {
    return { accepted: false, reason: 'invalid_format' };
  }

  const timestamp = Date.parse(evidence.timestamp);
  const now = Date.now();

  if (!Number.isFinite(timestamp) ||
      timestamp > now + MAX_FUTURE_MS ||
      timestamp < now - MAX_AGE_MS) {
    return { accepted: false, reason: 'invalid_timestamp' };
  }

  if (!verifySignedEvidence({
    evidence,
    publicKeyPem,
    signatureBase64
  })) {
    return { accepted: false, reason: 'invalid_signature' };
  }

  try {
    await FederationReplayNonce.create({
      nodeId: evidence.node_id,
      nonce: evidence.nonce,
      expiresAt: new Date(now + NONCE_RETENTION_MS)
    });

    return { accepted: true };
  } catch (error) {
    if (error.code === 11000) {
      return { accepted: false, reason: 'replay_detected' };
    }

    throw error;
  }
}

module.exports = {
  acceptFederatedEvidence
};
