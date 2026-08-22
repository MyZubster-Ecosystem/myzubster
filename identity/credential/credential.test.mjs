import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { publicKeyId, signCredential, verifyCredential } from './lib.mjs';

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
