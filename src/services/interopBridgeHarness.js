'use strict';

/**
 * src/services/interopBridgeHarness.js
 *
 * Mock Peer-to-Peer Interoperability & Bridge Payload Test Harness (Issue #1659 — Milestone M2).
 * Provides deterministic payload formatting, JCS canonicalization, integrity digest verification,
 * replay protection/idempotency guards, and disconnect/retry resilience for lab pilots.
 */

const crypto = require('crypto');

const INTEROP_SCHEMA_V1 = 'myzubster.interoperability-checkpoint.v1';

/**
 * Deterministically sorts keys and canonicalizes objects according to RFC 8785 (JCS).
 */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const sorted = {};
  const keys = Object.keys(value).sort();
  for (const key of keys) {
    if (value[key] !== undefined) {
      sorted[key] = canonicalize(value[key]);
    }
  }
  return sorted;
}

/**
 * Computes SHA-256 hash of canonicalized JSON.
 */
function computeDigest(data) {
  const json = JSON.stringify(canonicalize(data));
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Builds a standardized interoperability checkpoint payload.
 */
function createBridgePayload({
  contributorId,
  displayName,
  repository = 'MyZubster-Ecosystem/myzubster',
  pullRequest = null,
  commitSha,
  bridgeType = 'runtime',
  bridgeScope = 'mock-p2p-sync',
  environment = 'isolated-lab',
  procedure = 'Simulated P2P state synchronization',
  observation = {},
  evidenceState = 'VERIFIED_LOCAL',
  limitations = ['Mock endpoints only', 'No production wallet or onion connection']
}) {
  if (!contributorId || !displayName || !commitSha) {
    throw new Error('contributorId, displayName, and commitSha are required');
  }

  const payloadBody = {
    schema: INTEROP_SCHEMA_V1,
    contributor: {
      id: String(contributorId).trim(),
      displayName: String(displayName).trim()
    },
    source: {
      repository: String(repository).trim(),
      pullRequest: pullRequest ? Number(pullRequest) : null,
      commit: String(commitSha).trim()
    },
    bridge: {
      type: bridgeType,
      scope: bridgeScope
    },
    environment: String(environment).trim(),
    procedure: String(procedure).trim(),
    observation: canonicalize(observation),
    evidenceState,
    limitations: Array.isArray(limitations) ? limitations : [String(limitations)],
    provenance: {
      generatedAt: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex')
    }
  };

  const digest = computeDigest(payloadBody);

  return {
    ...payloadBody,
    integrity: {
      algorithm: 'sha256',
      digest
    }
  };
}

/**
 * Validates bridge payload structure and verifies cryptographic integrity.
 */
function verifyBridgePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, reason: 'Payload must be a non-null object' };
  }

  const { integrity, ...body } = payload;

  if (!integrity || integrity.algorithm !== 'sha256' || !integrity.digest) {
    return { valid: false, reason: 'Missing or malformed integrity digest' };
  }

  if (body.schema !== INTEROP_SCHEMA_V1) {
    return { valid: false, reason: `Unsupported schema version: ${body.schema}` };
  }

  if (!body.contributor?.id || !body.contributor?.displayName) {
    return { valid: false, reason: 'Missing contributor identification' };
  }

  if (!body.source?.commit || !/^[0-9a-f]{40}$/i.test(body.source.commit)) {
    return { valid: false, reason: 'Invalid or missing source commit hash' };
  }

  const expectedDigest = computeDigest(body);
  if (expectedDigest !== integrity.digest) {
    return {
      valid: false,
      reason: 'Digest mismatch: payload has been modified or tampered with',
      expected: expectedDigest,
      received: integrity.digest
    };
  }

  return { valid: true, digest: expectedDigest };
}

/**
 * In-memory Mock P2P Bridge Dispatcher with idempotency and retry handling.
 */
class InteropBridgeDispatcher {
  constructor({ maxRetries = 3, retryDelayMs = 10 } = {}) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
    this.processedDigests = new Map();
    this.auditLedger = [];
  }

  /**
   * Dispatches a bridge payload to a mock receiver with retry on transient failure.
   */
  async dispatch(payload, mockReceiver) {
    const verification = verifyBridgePayload(payload);
    if (!verification.valid) {
      return {
        success: false,
        error: verification.reason,
        code: 'PAYLOAD_VERIFICATION_FAILED'
      };
    }

    const digest = verification.digest;

    // Idempotency check: prevent duplicate processing or replay
    if (this.processedDigests.has(digest)) {
      return {
        success: true,
        idempotent: true,
        message: 'Payload already processed (idempotent replay ignored)',
        record: this.processedDigests.get(digest)
      };
    }

    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const response = await mockReceiver(payload, attempt);
        if (response && response.acknowledged) {
          const record = {
            digest,
            contributorId: payload.contributor.id,
            timestamp: new Date().toISOString(),
            attempts: attempt,
            receipt: response.receipt || crypto.randomBytes(8).toString('hex')
          };
          this.processedDigests.set(digest, record);
          this.auditLedger.push(record);
          return {
            success: true,
            idempotent: false,
            attempts: attempt,
            record
          };
        }
        throw new Error(response?.error || 'Mock peer unacknowledged');
      } catch (err) {
        lastError = err;
        if (attempt <= this.maxRetries) {
          await new Promise(r => setTimeout(r, this.retryDelayMs * Math.pow(2, attempt - 1)));
        }
      }
    }

    // Fail-closed after max retries
    return {
      success: false,
      error: `Peer delivery failed after ${this.maxRetries} retries: ${lastError?.message}`,
      code: 'DELIVERY_MAX_RETRIES_EXCEEDED',
      attempts: attempt
    };
  }

  /**
   * Retrieves audit ledger history for verification.
   */
  getAuditHistory() {
    return [...this.auditLedger];
  }
}

module.exports = {
  INTEROP_SCHEMA_V1,
  canonicalize,
  computeDigest,
  createBridgePayload,
  verifyBridgePayload,
  InteropBridgeDispatcher
};
