import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import {
  canonicalCredential,
  parseJsonNoDuplicateKeys,
  publicKeyId,
  signCredential,
  verifyCredential,
} from './lib.mjs';

function fixture() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const keyId = publicKeyId(publicKeyPem);
  const unsigned = {
    schema_version: 'myzubster-technical-identity/v1',
    credential_id: 'test-credential-1',
    key_id: keyId,
    issued_at: '2026-01-01T00:00:00Z',
    expires_at: '2027-01-01T00:00:00Z',
    subject: {
      name: 'Test Subject',
      project: 'MyZubster',
      github_organization: 'https://github.com/MyZubster-Ecosystem',
    },
    claims: {
      status: 'self-attested technical identity statement',
      legal_identity_document: false,
    },
  };
  const registry = {
    keys: [{ id: keyId, algorithm: 'Ed25519', status: 'active', public_key_pem: publicKeyPem }],
    revoked_key_ids: [],
  };
  return { privateKey, registry, signed: signCredential(unsigned, privateKey) };
}

const verificationTime = new Date('2026-08-22T00:00:00Z');

test('verifies a credential signed by an active trusted key', () => {
  const { registry, signed } = fixture();
  assert.equal(verifyCredential(signed, registry, verificationTime).ok, true);
});

test('rejects a modified claim', () => {
  const { registry, signed } = fixture();
  signed.subject.project = 'Forged Project';
  const result = verifyCredential(signed, registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.signature_valid, false);
});

test('rejects signature substitution from an untrusted key', () => {
  const trusted = fixture();
  const attacker = fixture();
  const result = verifyCredential(attacker.signed, trusted.registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.key_trusted, false);
});

test('rejects a revoked key even when the signature is valid', () => {
  const { registry, signed } = fixture();
  registry.revoked_key_ids.push(signed.key_id);
  const result = verifyCredential(signed, registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.key_not_revoked, false);
});

test('rejects an expired credential', () => {
  const { registry, signed } = fixture();
  const result = verifyCredential(signed, registry, new Date('2028-01-01T00:00:00Z'));
  assert.equal(result.ok, false);
  assert.equal(result.checks.currently_valid, false);
});

test('uses deterministic JCS-compatible canonicalization', () => {
  const first = { z: 1, nested: { b: true, a: 'value' }, signature: 'ignored', a: -0 };
  const second = { a: 0, nested: { a: 'value', b: true }, z: 1 };
  assert.equal(canonicalCredential(first), canonicalCredential(second));
  assert.equal(canonicalCredential(first), '{"a":0,"nested":{"a":"value","b":true},"z":1}');
  assert.throws(() => canonicalCredential({ value: Number.NaN }), /finite JSON number/);
  assert.throws(() => canonicalCredential({ value: String.fromCharCode(0xd800) }), /valid Unicode/);
});

test('rejects non-canonical and future timestamps', () => {
  const nonCanonical = fixture();
  nonCanonical.signed.issued_at = '2026-01-01 00:00:00Z';
  assert.equal(verifyCredential(nonCanonical.signed, nonCanonical.registry, verificationTime).checks.validity_window_well_formed, false);

  const future = fixture();
  future.signed.issued_at = '2026-09-01T00:00:00Z';
  const result = verifyCredential(future.signed, future.registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.issued_not_in_future, false);
});

test('rejects malformed registries and duplicate key IDs', () => {
  const malformed = fixture();
  malformed.registry.keys = 'not-an-array';
  assert.equal(verifyCredential(malformed.signed, malformed.registry, verificationTime).checks.registry_well_formed, false);

  const duplicate = fixture();
  duplicate.registry.keys.push({ ...duplicate.registry.keys[0] });
  const result = verifyCredential(duplicate.signed, duplicate.registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.registry_key_ids_unique, false);
});

test('rejects inactive keys, algorithm mismatch, and fingerprint mismatch', () => {
  for (const mutate of [
    (entry) => { entry.status = 'retired'; },
    (entry) => { entry.algorithm = 'RSA'; },
    (entry) => { entry.id = 'ed25519:wrong'; },
  ]) {
    const sample = fixture();
    mutate(sample.registry.keys[0]);
    assert.equal(verifyCredential(sample.signed, sample.registry, verificationTime).ok, false);
  }
});

test('rejects malformed base64 signatures', () => {
  const { registry, signed } = fixture();
  signed.signature = 'not-base64!';
  const result = verifyCredential(signed, registry, verificationTime);
  assert.equal(result.ok, false);
  assert.equal(result.checks.signature_valid, false);
});

test('rejects duplicate keys before credential or registry verification', () => {
  assert.throws(
    () => parseJsonNoDuplicateKeys('{"key_id":"trusted","key_id":"attacker"}'),
    /duplicate JSON object key: key_id/,
  );
  assert.throws(
    () => parseJsonNoDuplicateKeys('{"signature":"valid","signature":"substituted"}'),
    /duplicate JSON object key: signature/,
  );
  assert.throws(
    () => parseJsonNoDuplicateKeys('{"keys":[{"id":"trusted","id":"attacker"}],"revoked_key_ids":[]}'),
    /duplicate JSON object key: id/,
  );
  assert.throws(
    () => parseJsonNoDuplicateKeys('{"claims":{"status":"valid","status":"forged"}}'),
    /duplicate JSON object key: status/,
  );
});

test('strict parser preserves ordinary JSON values', () => {
  const value = parseJsonNoDuplicateKeys('{"array":[1,true,null,{"nested":"value"}]}');
  assert.deepEqual(value, { array: [1, true, null, { nested: 'value' }] });
  assert.throws(() => parseJsonNoDuplicateKeys('{"value":1} trailing'), /trailing JSON content/);
});
