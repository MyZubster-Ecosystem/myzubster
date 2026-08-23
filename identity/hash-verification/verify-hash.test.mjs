import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDigest, canonicalPayload, verifyDigest } from './hash.mjs';

const proof = {
  project: 'MyZubster',
  repositories: ['gateway', 'app'],
  metadata: { issued: '2026-08-21', version: 1 },
};

test('accepts a payload with its canonical digest', () => {
  const document = { ...proof, sha256_canonical_payload: calculateDigest(proof) };
  assert.equal(verifyDigest(document).ok, true);
});

test('rejects a tampered payload', () => {
  const document = { ...proof, sha256_canonical_payload: calculateDigest(proof) };
  document.project = 'Tampered';
  assert.equal(verifyDigest(document).ok, false);
});

test('produces the same digest regardless of object key insertion order', () => {
  const reordered = {
    metadata: { version: 1, issued: '2026-08-21' },
    repositories: ['gateway', 'app'],
    project: 'MyZubster',
  };
  assert.equal(calculateDigest(reordered), calculateDigest(proof));
});

test('omits only the top-level digest field and preserves array order', () => {
  const document = { sha256_canonical_payload: 'ignored', ...proof };
  assert.equal(canonicalPayload(document), canonicalPayload(proof));
  assert.notEqual(
    calculateDigest({ ...proof, repositories: [...proof.repositories].reverse() }),
    calculateDigest(proof),
  );
});

test('rejects a missing or malformed integrity reference', () => {
  assert.equal(verifyDigest(proof).ok, false);
  assert.equal(verifyDigest({ ...proof, sha256_canonical_payload: 'not-a-digest' }).ok, false);
});
