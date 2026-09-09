const {
  InMemoryAppendOnlyLedger, MockAnchorAdapter, buildMerkleTree,
  createMerkleProof, eventHash, generateSigningKeyPair, signEvent,
  validateEvent, verifyMerkleProof,
} = require('../src/services/ahpTraceabilityService');

function baseEvent(id, type, actor, previousEventIds = []) {
  return {
    schemaVersion: '1.0.0', eventId: id, ventureId: 'MZ-VENTURE-AHP-001', pilotId: 'MZ-AHP-PILOT-DEMO',
    eventType: type, occurredAt: '2026-09-09T00:00:00.000Z', actor,
    subjects: { designModelId: 'MZ-AHP-OS-001', designVersion: '0.2-draft', productLotId: 'LOT-DEMO-001' },
    measurements: [{ metric: 'mass', value: 10, unit: 'kg', method: 'synthetic-demo-scale' }],
    evidence: [], previousEventIds, verification: { state: 'SIGNED' },
  };
}

describe('AHP traceability vertical slice', () => {
  const { publicKey, privateKey } = generateSigningKeyPair();
  const actor = { actorId: 'actor-demo-1', role: 'PILOT_ADMIN', keyId: 'key-demo-1' };

  test('records a signed append-only chain and anchors its Merkle root', async () => {
    const ledger = new InMemoryAppendOnlyLedger({ resolvePublicKey: id => id === actor.keyId ? publicKey : null });
    const first = signEvent(baseEvent('MZ-AHP-EVT-001', 'DESIGN_VERSION_PUBLISHED', actor), privateKey, actor.keyId);
    const second = signEvent(baseEvent('MZ-AHP-EVT-002', 'LOT_CREATED', actor, [first.eventId]), privateKey, actor.keyId);
    ledger.append(first);
    ledger.append(second);

    const manifest = ledger.manifest();
    const receipt = await new MockAnchorAdapter().anchor(manifest);
    const proof = createMerkleProof(manifest.tree, 1);

    expect(receipt.merkleRoot).toBe(manifest.merkleRoot);
    expect(receipt.simulated).toBe(true);
    expect(verifyMerkleProof(eventHash(second), proof, manifest.merkleRoot)).toBe(true);
  });

  test('detects tampering', () => {
    const signed = signEvent(baseEvent('MZ-AHP-EVT-003', 'COLLECTION_RECORDED', actor), privateKey, actor.keyId);
    const originalHash = eventHash(signed);
    const tree = buildMerkleTree([originalHash]);
    const tampered = { ...signed, measurements: [{ ...signed.measurements[0], value: 999 }] };
    expect(verifyMerkleProof(eventHash(tampered), [], tree.root)).toBe(false);
  });

  test('rejects personal or health data keys', () => {
    const unsafe = signEvent({ ...baseEvent('MZ-AHP-EVT-004', 'LOT_SUPPLIED', actor), consumer: { email: 'private@example.test' } }, privateKey, actor.keyId);
    expect(validateEvent(unsafe).join(' ')).toMatch(/forbidden/);
  });

  test('rejects duplicate IDs and unknown chain references', () => {
    const ledger = new InMemoryAppendOnlyLedger({ resolvePublicKey: () => publicKey });
    const event = signEvent(baseEvent('MZ-AHP-EVT-005', 'LOT_CREATED', actor), privateKey, actor.keyId);
    ledger.append(event);
    expect(() => ledger.append(event)).toThrow(/duplicate/);
    const orphan = signEvent(baseEvent('MZ-AHP-EVT-006', 'LOT_SUPPLIED', actor, ['MZ-AHP-EVT-MISSING']), privateKey, actor.keyId);
    expect(() => ledger.append(orphan)).toThrow(/unknown previous/);
  });
});
