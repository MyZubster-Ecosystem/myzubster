'use strict';

/**
 * src/services/interopBridgeHarness.js
 *
 * Mock Peer-to-Peer Interoperability & Bridge Payload Test Harness (Issue #1659 — Milestone M2).
 * Provides deterministic RFC 8785 (JCS) canonicalization, SHA-256 integrity digests,
 * sender authenticity via HMAC-SHA256 and Ed25519 signatures, replay protection/idempotency guards,
 * and disconnect/retry resilience for lab pilots.
 *
 * ARCHITECTURAL SPECIFICATIONS FOR PRODUCTION PEER INTEGRATION:
 * 1. Peer Key Identity & Trust Anchor:
 *    - In real peer topologies, contributor IDs must be strictly mapped to out-of-band verified
 *      public keys (e.g. Ed25519 SPKI PEM) stored in a secure local trust store or signed by a root CA.
 *    - Payloads presenting an unknown or mismatched contributor public key must be rejected immediately.
 * 2. Key Rotation Protocol:
 *    - Key rotation requires a dual-signed transition checkpoint: the new key must be signed by
 *      the preceding active key before retirement, with an explicit monotonic sequence number and validity window.
 * 3. Replay Protection & Persistence Across Restarts:
 *    - The in-memory Map in this harness is strictly for local unit testing and mock lab execution.
 *    - Production-facing callers must bind idempotency digests to persistent storage (e.g., Redis `SET NX EX`
 *      or MongoDB unique TTL index on `integrity.digest`) with mandatory clock skew / expiry validation (<= 300s).
 * 4. Production Fail-Closed Boundary:
 *    - `requireAuth=false` is strictly mock-only. In production/serverless runtimes, `verifyBridgePayload`
 *      and `InteropBridgeDispatcher` automatically enforce `requireAuth=true` and fail closed.
 */

const crypto = require('crypto');

const INTEROP_SCHEMA_V1 = 'myzubster.interoperability-checkpoint.v1';

/**
 * Detects whether execution is occurring in a production, preview, or cloud serverless environment.
 */
function isProductionEnvironment() {
  return Boolean(
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );
}

/**
 * Serializes string with lone surrogate checks per RFC 8785 Section 3.2.2.2.
 */
function serializeString(value) {
  if (typeof value.isWellFormed === 'function' && !value.isWellFormed()) {
    throw new Error('Lone surrogate is not allowed in RFC 8785 JCS');
  }
  return JSON.stringify(value);
}

/**
 * Serializes primitive values per RFC 8785 Section 3.2.2.
 */
function serializePrimitive(value) {
  switch (typeof value) {
    case 'number':
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        throw new Error('NaN and Infinity are not allowed in RFC 8785 JCS');
      }
      // JSON.stringify(-0) returns "0", and finite numbers follow IEEE 754 per RFC 8785 section 3.2.2.3
      return JSON.stringify(value);
    case 'string':
      return serializeString(value);
    case 'boolean':
      return value ? 'true' : 'false';
    default:
      return JSON.stringify(value);
  }
}

/**
 * Complete, compliant RFC 8785 (JSON Canonicalization Scheme / JCS) serialization.
 *
 * Serializes any JavaScript value directly to a canonical UTF-8 JSON string:
 * - Object property keys are sorted by UTF-16 code units (RFC 8785 Section 3.2.3).
 * - Integer-like keys are preserved in lexicographical order (bypassing V8 numeric property reordering).
 * - Floats and negative zero are normalized per IEEE 754.
 * - Circular references and lone surrogates are detected and rejected.
 *
 * @param {*} object
 * @returns {string} Canonical JSON string
 */
function canonicalize(object) {
  if (object === null || typeof object !== 'object') {
    return serializePrimitive(object);
  }

  const seen = new Set();

  function serialize(value) {
    while (value !== null && typeof value === 'object' && typeof value.toJSON === 'function') {
      if (seen.has(value)) {
        throw new Error('Circular reference detected in RFC 8785 JCS');
      }
      seen.add(value);
      value = value.toJSON();
    }

    if (value instanceof Number || value instanceof String || value instanceof Boolean) {
      value = value.valueOf();
    }

    if (value === null || typeof value !== 'object') {
      return serializePrimitive(value);
    }

    if (seen.has(value)) {
      throw new Error('Circular reference detected in RFC 8785 JCS');
    }
    seen.add(value);

    let result;
    if (Array.isArray(value)) {
      result = '[';
      for (let i = 0; i < value.length; i++) {
        if (i > 0) result += ',';
        const item = value[i];
        if (item === undefined || typeof item === 'symbol' || typeof item === 'function') {
          result += 'null';
        } else {
          result += serialize(item);
        }
      }
      result += ']';
    } else {
      result = '{';
      // RFC 8785 Section 3.2.3:
      // Keys MUST be sorted in lexicographical order based on UTF-16 code unit values.
      // Array.prototype.sort() with no arguments sorts strings by UTF-16 code units.
      const keys = Object.keys(value).sort();
      let first = true;
      for (const key of keys) {
        const propVal = value[key];
        if (propVal === undefined || typeof propVal === 'symbol' || typeof propVal === 'function') {
          continue;
        }
        if (!first) result += ',';
        first = false;
        result += serializeString(key) + ':' + serialize(propVal);
      }
      result += '}';
    }

    seen.delete(value);
    return result;
  }

  return serialize(object);
}

/**
 * Computes SHA-256 hash of canonicalized JSON.
 *
 * @param {*} data
 * @returns {string} Hexadecimal SHA-256 digest
 */
function computeDigest(data) {
  const json = typeof data === 'string' ? data : canonicalize(data);
  return crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

/**
 * Builds a standardized interoperability checkpoint payload.
 *
 * Supports optional sender authenticity via HMAC-SHA256 or Ed25519 digital signatures.
 *
 * @param {Object} options
 * @param {string} options.contributorId
 * @param {string} options.displayName
 * @param {string} [options.repository='MyZubster-Ecosystem/myzubster']
 * @param {number|null} [options.pullRequest=null]
 * @param {string} options.commitSha
 * @param {string} [options.bridgeType='runtime']
 * @param {string} [options.bridgeScope='mock-p2p-sync']
 * @param {string} [options.environment='isolated-lab']
 * @param {string} [options.procedure='Simulated P2P state synchronization']
 * @param {Object} [options.observation={}]
 * @param {string} [options.evidenceState='VERIFIED_LOCAL']
 * @param {string[]} [options.limitations]
 * @param {string|Buffer} [options.authSecret] - Shared secret for HMAC-SHA256 authentication
 * @param {string|crypto.KeyObject} [options.privateKey] - Ed25519/asymmetric private key for digital signature
 * @param {string} [options.keyId] - Key identifier
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
  limitations = ['Mock endpoints only', 'No production wallet or onion connection'],
  authSecret = null,
  privateKey = null,
  keyId = null
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
    observation,
    evidenceState,
    limitations: Array.isArray(limitations) ? limitations : [String(limitations)],
    provenance: {
      generatedAt: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex')
    }
  };

  const canonicalBody = canonicalize(payloadBody);
  const digest = crypto.createHash('sha256').update(canonicalBody, 'utf8').digest('hex');

  let authentication = null;
  if (authSecret) {
    const hmac = crypto.createHmac('sha256', authSecret).update(canonicalBody, 'utf8').digest('hex');
    authentication = {
      algorithm: 'hmac-sha256',
      keyId: keyId || `key:${contributorId}`,
      signature: hmac
    };
  } else if (privateKey) {
    const sig = crypto.sign(null, Buffer.from(canonicalBody, 'utf8'), privateKey).toString('hex');
    authentication = {
      algorithm: 'ed25519',
      keyId: keyId || `key:${contributorId}`,
      signature: sig
    };
  }

  const payload = {
    ...payloadBody,
    integrity: {
      algorithm: 'sha256',
      digest
    }
  };

  if (authentication) {
    payload.authentication = authentication;
  }

  return payload;
}

/**
 * Validates bridge payload structure and verifies cryptographic integrity and sender authenticity.
 *
 * @param {Object} payload - Checkpoint payload to verify
 * @param {Object} [options]
 * @param {string|Buffer} [options.authSecret] - Expected secret for HMAC-SHA256 authentication
 * @param {string|crypto.KeyObject} [options.publicKey] - Expected public key for Ed25519 signature
 * @param {boolean} [options.requireAuth=false] - When true, rejects payloads lacking cryptographic authentication
 * @returns {Object} Verification outcome
 */
function verifyBridgePayload(payload, { authSecret, publicKey, requireAuth = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, reason: 'Payload must be a non-null object' };
  }

  const { integrity, authentication, ...body } = payload;

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

  let canonicalBody;
  try {
    canonicalBody = canonicalize(body);
  } catch (err) {
    return { valid: false, reason: `Canonicalization failed: ${err.message}` };
  }

  const expectedDigest = crypto.createHash('sha256').update(canonicalBody, 'utf8').digest('hex');
  if (expectedDigest !== integrity.digest) {
    return {
      valid: false,
      reason: 'Digest mismatch: payload has been modified or tampered with',
      expected: expectedDigest,
      received: integrity.digest
    };
  }

  // Handle Authentication / Sender Authenticity
  // In production or cloud deployments, requireAuth=false is forbidden. Callers must supply cryptographic proof.
  const enforcedRequireAuth = requireAuth || isProductionEnvironment();
  if (enforcedRequireAuth && !authentication) {
    return {
      valid: false,
      reason: 'Cryptographic authentication required: unkeyed digest alone does not prove sender authenticity (mock-only mode requireAuth=false fails closed in production)'
    };
  }

  if (authentication) {
    if (!authentication.signature || !authentication.algorithm) {
      return { valid: false, reason: 'Missing or malformed authentication block' };
    }

    if (authentication.algorithm === 'hmac-sha256') {
      if (!authSecret) {
        return {
          valid: false,
          reason: 'Cannot verify HMAC signature without authSecret'
        };
      }
      const expectedHmac = crypto.createHmac('sha256', authSecret).update(canonicalBody, 'utf8').digest('hex');
      const sigBuf = Buffer.from(authentication.signature, 'hex');
      const expBuf = Buffer.from(expectedHmac, 'hex');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return {
          valid: false,
          reason: 'HMAC signature mismatch: sender authenticity check failed'
        };
      }
      return {
        valid: true,
        authenticated: true,
        authAlgorithm: 'hmac-sha256',
        keyId: authentication.keyId,
        digest: expectedDigest
      };
    } else if (authentication.algorithm === 'ed25519') {
      if (!publicKey) {
        return {
          valid: false,
          reason: 'Cannot verify Ed25519 signature without publicKey'
        };
      }
      try {
        const isVerified = crypto.verify(
          null,
          Buffer.from(canonicalBody, 'utf8'),
          publicKey,
          Buffer.from(authentication.signature, 'hex')
        );
        if (!isVerified) {
          return {
            valid: false,
            reason: 'Ed25519 signature mismatch: sender authenticity check failed'
          };
        }
        return {
          valid: true,
          authenticated: true,
          authAlgorithm: 'ed25519',
          keyId: authentication.keyId,
          digest: expectedDigest
        };
      } catch (err) {
        return {
          valid: false,
          reason: `Ed25519 signature verification error: ${err.message}`
        };
      }
    } else {
      return {
        valid: false,
        reason: `Unsupported authentication algorithm: ${authentication.algorithm}`
      };
    }
  }

  // Unauthenticated fallback: Accidental integrity only (mock boundary)
  return {
    valid: true,
    authenticated: false,
    mode: 'unauthenticated-mock-integrity-only',
    warning: 'Unkeyed digest only guarantees accidental corruption detection; sender authenticity and active anti-tampering are NOT guaranteed without cryptographic authentication.',
    digest: expectedDigest
  };
}

/**
 * In-memory Mock P2P Bridge Dispatcher with idempotency, authentication, and retry handling.
 */
class InteropBridgeDispatcher {
  constructor({ maxRetries = 3, retryDelayMs = 10, requireAuth = false, authSecret = null, publicKey = null } = {}) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
    this.requireAuth = requireAuth || isProductionEnvironment();
    this.authSecret = authSecret;
    this.publicKey = publicKey;
    this.processedDigests = new Map();
    this.auditLedger = [];
  }

  /**
   * Dispatches a bridge payload to a mock receiver with retry on transient failure.
   */
  async dispatch(payload, mockReceiver) {
    const verification = verifyBridgePayload(payload, {
      authSecret: this.authSecret,
      publicKey: this.publicKey,
      requireAuth: this.requireAuth
    });

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
            authenticated: verification.authenticated,
            receipt: response.receipt || crypto.randomBytes(8).toString('hex')
          };
          this.processedDigests.set(digest, record);
          this.auditLedger.push(record);
          return {
            success: true,
            idempotent: false,
            attempts: attempt,
            authenticated: verification.authenticated,
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
