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
      eventCount: 11,
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

  test('accepts a signed sensor reading linked to a kefir lot', () => {
    const ledger = new KefirPilotLedger({ resolvePublicKey: () => publicKey });
    const reading = signEvent({
      ...event('MZ-KEFIR-EVT-SENSOR-001', 'SENSOR_READING_RECORDED', actor, {
        cultureId: 'MZ-KEFIR-CULTURE-TEST-001',
        deviceId: 'MZ-KEFIR-DEVICE-ESP32-001',
      }),
      measurements: [
        { metric: 'temperature', value: 22.4, unit: 'C', method: 'DHT22' },
        { metric: 'ph', value: 4.5, unit: 'pH', method: 'analog-probe' },
      ],
    }, privateKey, actor.keyId);
    expect(validateKefirEvent(reading)).toEqual([]);
    expect(ledger.append(reading).sequence).toBe(1);
  });

  test('rejects malformed sensor readings', () => {
    const invalid = signEvent({
      ...event('MZ-KEFIR-EVT-SENSOR-BAD', 'SENSOR_READING_RECORDED', actor),
      measurements: [{ metric: 'temperature', value: '22.4', unit: 'C' }],
    }, privateKey, actor.keyId);
    expect(validateKefirEvent(invalid).join(' ')).toMatch(/deviceId|finite numeric value/);
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
