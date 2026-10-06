const {
  KefirPilotLedger,
  createSyntheticKefirDemo,
  validateKefirEvent,
} = require('../src/services/kefirPilotService');
const { generateSigningKeyPair, signEvent } = require('../src/services/ahpTraceabilityService');

function event(id, type, actor, subjects = {}, previousEventIds = []) {
  return {
    schemaVersion: '1.0.0',
    eventId: id,
    ventureId: 'MZ-VENTURE-KEFIR-001',
    pilotId: 'MZ-KEFIR-PILOT-001',
    eventType: type,
    occurredAt: '2026-09-10T08:00:00.000Z',
    actor,
    subjects: { productLotId: 'MZ-KEFIR-LOT-TEST-001', ...subjects },
    evidence: [],
    previousEventIds,
    verification: { state: 'SIGNED', synthetic: true },
  };
}

describe('Kefir circular pilot', () => {
  const { publicKey, privateKey } = generateSigningKeyPair();
  const actor = { actorId: 'MZ-KEFIR-ACTOR-TEST', role: 'PILOT_ADMIN', keyId: 'kefir-test-key' };

  test('runs a complete synthetic container loop with a valid Merkle proof', () => {
    const result = createSyntheticKefirDemo();
    expect(result).toMatchObject({
      ok: true,
      synthetic: true,
      foodDistributed: false,
      eventCount: 10,
      finalEventProofValid: true,
      containerState: 'REUSED',
    });
  });

  test('rejects personal and health data', () => {
    const unsafe = signEvent({
      ...event('MZ-KEFIR-EVT-UNSAFE', 'KEFIR_BATCH_CREATED', actor),
      consumer: { email: 'private@example.test' },
    }, privateKey, actor.keyId);
    expect(validateKefirEvent(unsafe).join(' ')).toMatch(/forbidden/);
  });

  test('enforces container lifecycle ordering', () => {
    const ledger = new KefirPilotLedger({ resolvePublicKey: () => publicKey });
    const returned = signEvent(event(
      'MZ-KEFIR-EVT-RETURN-FIRST',
      'CONTAINER_RETURNED',
      actor,
      { containerId: 'MZ-KEFIR-CONTAINER-001' },
    ), privateKey, actor.keyId);
    expect(() => ledger.append(returned)).toThrow(/invalid container transition/);
  });

  test('accepts a signed distribution and return chain', () => {
    const ledger = new KefirPilotLedger({ resolvePublicKey: () => publicKey });
    const distributed = signEvent(event(
      'MZ-KEFIR-EVT-DISTRIBUTED',
      'CONTAINER_DISTRIBUTED',
      actor,
      { containerId: 'MZ-KEFIR-CONTAINER-002' },
    ), privateKey, actor.keyId);
    ledger.append(distributed);
    const returned = signEvent(event(
      'MZ-KEFIR-EVT-RETURNED',
      'CONTAINER_RETURNED',
      actor,
      { containerId: 'MZ-KEFIR-CONTAINER-002' },
      [distributed.eventId],
    ), privateKey, actor.keyId);
    expect(ledger.append(returned).sequence).toBe(2);
  });
});
