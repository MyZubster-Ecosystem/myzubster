'use strict';

const {
  validateFederationEvidence
} = require('./federationEvidenceValidator');

function validEvidence() {
  return {
    version: 1,
    type: 'node-attestation',
    node_id: 'myzubster:ed25519:' + 'a'.repeat(64),
    timestamp: '2026-10-15T17:00:00.000Z',
    nonce: 'b'.repeat(32),
    payload: {
      message: 'N4K48 validation test'
    }
  };
}

describe('Federation evidence validator', () => {
  test('accepts valid evidence', () => {
    expect(
      validateFederationEvidence(validEvidence())
    ).toBe(true);
  });

  test.each([
    ['invalid version', { version: 2 }],
    ['invalid type', { type: 'unknown' }],
    ['invalid node ID', { node_id: 'fake' }],
    ['invalid timestamp', { timestamp: 'yesterday' }],
    ['impossible date', {
      timestamp: '2026-02-30T12:00:00.000Z'
    }],
    ['invalid nonce', { nonce: '123' }],
    ['invalid payload', { payload: [] }]
  ])('rejects %s', (_name, changes) => {
    expect(
      validateFederationEvidence({
        ...validEvidence(),
        ...changes
      })
    ).toBe(false);
  });

  test('rejects unexpected fields', () => {
    expect(
      validateFederationEvidence({
        ...validEvidence(),
        unexpected: true
      })
    ).toBe(false);
  });

  test('rejects missing fields', () => {
    const evidence = validEvidence();
    delete evidence.payload;

    expect(
      validateFederationEvidence(evidence)
    ).toBe(false);
  });
});

describe('Federation JSON security limits', () => {
  test('rejects evidence larger than 64 KiB', () => {
    expect(validateFederationEvidence({
      ...validEvidence(),
      payload: { message: 'x'.repeat(65536) }
    })).toBe(false);
  });

  test('rejects excessive JSON depth', () => {
    let nested = { value: 'test' };

    for (let i = 0; i < 20; i++) {
      nested = { child: nested };
    }

    expect(validateFederationEvidence({
      ...validEvidence(),
      payload: nested
    })).toBe(false);
  });

  test('rejects circular references', () => {
    const evidence = validEvidence();
    evidence.payload.self = evidence.payload;

    expect(validateFederationEvidence(evidence)).toBe(false);
  });

  test.each([
    ['undefined', undefined],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['BigInt', 1n],
    ['Date', new Date()]
  ])('rejects non-JSON value %s', (_name, value) => {
    expect(validateFederationEvidence({
      ...validEvidence(),
      payload: { value }
    })).toBe(false);
  });
});
