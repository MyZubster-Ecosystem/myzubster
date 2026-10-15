'use strict';

const crypto = require('node:crypto');

const {
  canonicalizeEvidence,
  nodeIdFromPublicKey,
  verifySignedEvidence
} = require('./signedEvidence');

describe('MyZubster Signed Evidence', () => {
  const { publicKey, privateKey } =
    crypto.generateKeyPairSync('ed25519');

  const publicKeyPem = publicKey.export({
    type: 'spki',
    format: 'pem'
  });

  const nodeId = nodeIdFromPublicKey(publicKeyPem);

  function createSignedEvidence() {
    const evidence = {
      version: 1,
      type: 'node-attestation',
      node_id: nodeId,
      timestamp: '2026-10-15T18:00:00Z',
      nonce: 'test-nonce-001',
      payload: {
        message: 'N4K48 test'
      }
    };

    const signatureBase64 = crypto.sign(
      null,
      canonicalizeEvidence(evidence),
      privateKey
    ).toString('base64');

    return { evidence, publicKeyPem, signatureBase64 };
  }

  test('accepts a valid signature', () => {
    expect(verifySignedEvidence(createSignedEvidence()))
      .toBe(true);
  });

  test('rejects modified evidence', () => {
    const signed = createSignedEvidence();
    signed.evidence.payload.message = 'ALTERED';

    expect(verifySignedEvidence(signed))
      .toBe(false);
  });

  test('rejects a mismatched node ID', () => {
    const signed = createSignedEvidence();
    signed.evidence.node_id = 'myzubster:ed25519:fake';

    expect(verifySignedEvidence(signed))
      .toBe(false);
  });

  test('canonicalization is independent of key order', () => {
    const a = { z: 1, a: { y: 2, x: 3 } };
    const b = { a: { x: 3, y: 2 }, z: 1 };

    expect(canonicalizeEvidence(a).equals(canonicalizeEvidence(b)))
      .toBe(true);
  });
});
