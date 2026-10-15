'use strict';

const crypto = require('node:crypto');

jest.mock('../models/FederationReplayNonce', () => ({
  create: jest.fn()
}));

const FederationReplayNonce =
  require('../models/FederationReplayNonce');

const {
  canonicalizeEvidence,
  nodeIdFromPublicKey
} = require('./signedEvidence');

const {
  acceptFederatedEvidence
} = require('./federationReplayGuard');

const { publicKey, privateKey } =
  crypto.generateKeyPairSync('ed25519');

const publicKeyPem = publicKey.export({
  type: 'spki',
  format: 'pem'
});

function signedEvidence(overrides = {}) {
  const evidence = {
    version: 1,
    type: 'node-attestation',
    node_id: nodeIdFromPublicKey(publicKeyPem),
    timestamp: new Date().toISOString(),
    nonce: crypto.randomBytes(16).toString('hex'),
    payload: { message: 'N4K48 replay test' },
    ...overrides
  };

  const signatureBase64 = crypto.sign(
    null,
    canonicalizeEvidence(evidence),
    privateKey
  ).toString('base64');

  return { evidence, publicKeyPem, signatureBase64 };
}

beforeEach(() => {
  jest.clearAllMocks();
  FederationReplayNonce.create.mockResolvedValue({});
});

test('accepts valid signed evidence', async () => {
  const result = await acceptFederatedEvidence(
    signedEvidence()
  );

  expect(result).toEqual({ accepted: true });
  expect(FederationReplayNonce.create)
    .toHaveBeenCalledTimes(1);
});

test('rejects a duplicate nonce', async () => {
  FederationReplayNonce.create.mockRejectedValue({
    code: 11000
  });

  const result = await acceptFederatedEvidence(
    signedEvidence()
  );

  expect(result).toEqual({
    accepted: false,
    reason: 'replay_detected'
  });
});

test('rejects an invalid schema before database access', async () => {
  const result = await acceptFederatedEvidence(
    signedEvidence({ version: 99 })
  );

  expect(result).toEqual({
    accepted: false,
    reason: 'invalid_evidence'
  });

  expect(FederationReplayNonce.create)
    .not.toHaveBeenCalled();
});

test('rejects an expired timestamp', async () => {
  const result = await acceptFederatedEvidence(
    signedEvidence({
      timestamp: new Date(
        Date.now() - 10 * 60 * 1000
      ).toISOString()
    })
  );

  expect(result).toEqual({
    accepted: false,
    reason: 'invalid_timestamp'
  });

  expect(FederationReplayNonce.create)
    .not.toHaveBeenCalled();
});

test('rejects tampering before database access', async () => {
  const signed = signedEvidence();

  signed.evidence.payload.message = 'TAMPERED';

  const result = await acceptFederatedEvidence(signed);

  expect(result).toEqual({
    accepted: false,
    reason: 'invalid_signature'
  });

  expect(FederationReplayNonce.create)
    .not.toHaveBeenCalled();
});

test('propagates unexpected database errors', async () => {
  FederationReplayNonce.create.mockRejectedValue(
    new Error('database unavailable')
  );

  await expect(
    acceptFederatedEvidence(signedEvidence())
  ).rejects.toThrow('database unavailable');
});
