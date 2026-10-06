import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalWithoutDigest,
  sha256,
  verifyIdentityJson,
  verifyIdentityProof,
} from './lib.mjs';

function validProof() {
  const proof = {
    document_type: 'MyZubster Digital Identity Proof',
    status: 'self-attested technical identity statement',
    legal_identity_document: false,
    name: 'Test Subject',
    project: 'MyZubster',
    github_organization: 'https://github.com/MyZubster-Ecosystem',
  };
  proof.sha256_canonical_payload = sha256(canonicalWithoutDigest(proof));
  return proof;
}

test('accepts a valid proof', () => {
  const result = verifyIdentityProof(validProof(), 'proof.json');
  assert.equal(result.ok, true);
  assert.equal(result.checks.digest_matches, true);
});

test('rejects a tampered payload', () => {
  const proof = validProof();
  proof.project = 'Forged Project';
  const result = verifyIdentityProof(proof);
  assert.equal(result.ok, false);
  assert.equal(result.checks.digest_matches, false);
});

test('rejects an invalid structure without throwing', () => {
  const result = verifyIdentityProof([]);
  assert.equal(result.ok, false);
  assert.equal(result.checks.schema_readable, false);
});

test('rejects malformed JSON deterministically', () => {
  const result = verifyIdentityJson('{not-json', 'broken.json');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid_json');
});

test('canonicalization is independent of object key order', () => {
  const first = { z: 1, nested: { b: 2, a: 1 }, a: 2 };
  const second = { a: 2, nested: { a: 1, b: 2 }, z: 1 };
  assert.equal(canonicalWithoutDigest(first), canonicalWithoutDigest(second));
});
