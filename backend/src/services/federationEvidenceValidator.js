'use strict';

const REQUIRED_FIELDS = [
  'version',
  'type',
  'node_id',
  'timestamp',
  'nonce',
  'payload'
];


const MAX_EVIDENCE_BYTES = 64 * 1024;
const MAX_JSON_DEPTH = 16;

function isSafeJson(value, depth, seen) {
  if (depth > MAX_JSON_DEPTH) {
    return false;
  }

  if (value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean') {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'object') {
    return false;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null &&
      !Array.isArray(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  const keys = Object.keys(value);

  if (keys.some(key =>
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'prototype'
  )) {
    return false;
  }

  for (const key of keys) {
    if (!isSafeJson(value[key], depth + 1, seen)) {
      return false;
    }
  }

  seen.delete(value);
  return true;
}

function validateFederationEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object' ||
      Array.isArray(evidence)) {
    return false;
  }

  if (!isSafeJson(evidence, 0, new WeakSet())) {
    return false;
  }

  let encoded;

  try {
    encoded = JSON.stringify(evidence);
  } catch {
    return false;
  }

  if (typeof encoded !== 'string' ||
      Buffer.byteLength(encoded, 'utf8') > MAX_EVIDENCE_BYTES) {
    return false;
  }

  const keys = Object.keys(evidence).sort();
  const expected = [...REQUIRED_FIELDS].sort();

  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    return false;
  }

  if (evidence.version !== 1 ||
      evidence.type !== 'node-attestation') {
    return false;
  }

  if (typeof evidence.node_id !== 'string' ||
      !/^myzubster:ed25519:[a-f0-9]{64}$/.test(evidence.node_id)) {
    return false;
  }

  if (typeof evidence.timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
        evidence.timestamp
      )) {
    return false;
  }

  const parsed = new Date(evidence.timestamp);

  if (Number.isNaN(parsed.getTime()) ||
      parsed.toISOString() !== evidence.timestamp) {
    return false;
  }

  if (typeof evidence.nonce !== 'string' ||
      !/^[a-f0-9]{32}$/.test(evidence.nonce)) {
    return false;
  }

  if (!evidence.payload ||
      typeof evidence.payload !== 'object' ||
      Array.isArray(evidence.payload)) {
    return false;
  }

  return true;
}

module.exports = {
  validateFederationEvidence
};
