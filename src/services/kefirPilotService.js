const {
  buildMerkleTree,
  canonicalize,
  createMerkleProof,
  eventHash,
  generateSigningKeyPair,
  signEvent,
  verifyEventSignature,
  verifyMerkleProof,
} = require('./ahpTraceabilityService');

const EVENT_TYPES = new Set([
  'KEFIR_PROCESS_VERSION_PUBLISHED',
  'KEFIR_CULTURE_REGISTERED',
  'KEFIR_BATCH_CREATED',
  'FERMENTATION_RECORDED',
  'QUALITY_CHECK_RECORDED',
  'BATCH_RELEASED',
  'CONTAINER_DISTRIBUTED',
  'CONTAINER_RETURNED',
  'CONTAINER_SANITIZED',
  'CONTAINER_REUSED',
  'SURPLUS_DESTINATION_RECORDED',
  'CORRECTION_ISSUED',
  'ANCHOR_PUBLISHED',
]);

const FORBIDDEN_KEYS = /^(name|email|phone|address|medical|health|patient|consumer|diagnosis)$/i;

function findForbiddenKey(value, path = '$') {
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`;
    if (FORBIDDEN_KEYS.test(key)) return next;
    const nested = findForbiddenKey(child, next);
    if (nested) return nested;
  }
  return null;
}

function validateKefirEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object' || Array.isArray(event)) return ['event must be an object'];
  if (event.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (!/^MZ-KEFIR-EVT-[A-Za-z0-9_-]+$/.test(event.eventId || '')) errors.push('invalid eventId');
  if (event.ventureId !== 'MZ-VENTURE-KEFIR-001') errors.push('invalid ventureId');
  if (event.pilotId !== 'MZ-KEFIR-PILOT-001') errors.push('invalid pilotId');
  if (!EVENT_TYPES.has(event.eventType)) errors.push('invalid eventType');
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) errors.push('valid occurredAt is required');
  if (!event.actor?.actorId || !event.actor?.role || !event.actor?.keyId) errors.push('complete actor is required');
  if (!event.subjects?.productLotId) errors.push('productLotId is required');
  if (!Array.isArray(event.evidence)) errors.push('evidence must be an array');
  if (!event.verification?.state) errors.push('verification state is required');
  if (!event.signature?.algorithm || !event.signature?.keyId || !event.signature?.value) errors.push('signature is required');
  const forbidden = findForbiddenKey(event);
  if (forbidden) errors.push(`personal or health data key is forbidden: ${forbidden}`);
  return errors;
}

class KefirPilotLedger {
  constructor({ resolvePublicKey }) {
    this.resolvePublicKey = resolvePublicKey;
    this.records = [];
    this.ids = new Set();
    this.containerState = new Map();
  }

  append(event) {
    const errors = validateKefirEvent(event);
    if (errors.length) throw new Error(errors.join('; '));
    if (this.ids.has(event.eventId)) throw new Error('duplicate eventId');
    const publicKey = this.resolvePublicKey(event.actor.keyId);
    if (!publicKey || !verifyEventSignature(event, publicKey)) throw new Error('invalid event signature');
    for (const previousId of event.previousEventIds || []) {
      if (!this.ids.has(previousId)) throw new Error(`unknown previous event: ${previousId}`);
    }
    this.applyContainerTransition(event);
    const record = Object.freeze({ event: Object.freeze(event), hash: eventHash(event), sequence: this.records.length + 1 });
    this.records.push(record);
    this.ids.add(event.eventId);
    return record;
  }

  applyContainerTransition(event) {
    const id = event.subjects.containerId;
    if (!id) return;
    const current = this.containerState.get(id) || 'NEW';
    const allowed = {
      CONTAINER_DISTRIBUTED: ['NEW', 'SANITIZED'],
      CONTAINER_RETURNED: ['DISTRIBUTED'],
      CONTAINER_SANITIZED: ['RETURNED'],
      CONTAINER_REUSED: ['SANITIZED'],
    };
    if (allowed[event.eventType] && !allowed[event.eventType].includes(current)) {
      throw new Error(`invalid container transition: ${current} -> ${event.eventType}`);
    }
    const next = {
      CONTAINER_DISTRIBUTED: 'DISTRIBUTED',
      CONTAINER_RETURNED: 'RETURNED',
      CONTAINER_SANITIZED: 'SANITIZED',
      CONTAINER_REUSED: 'REUSED',
    }[event.eventType];
    if (next) this.containerState.set(id, next);
  }

  manifest() {
    const eventHashes = this.records.map(record => record.hash);
    const tree = buildMerkleTree(eventHashes);
    return { schemaVersion: '1.0.0', eventCount: eventHashes.length, eventHashes, merkleRoot: tree.root, tree };
  }
}

function createSyntheticKefirDemo() {
  const keys = generateSigningKeyPair();
  const actor = { actorId: 'MZ-KEFIR-ACTOR-SYNTHETIC', role: 'PILOT_ADMIN', keyId: 'ephemeral-kefir-demo-key' };
  const ledger = new KefirPilotLedger({ resolvePublicKey: keyId => keyId === actor.keyId ? keys.publicKey : null });
  const types = [
    'KEFIR_PROCESS_VERSION_PUBLISHED', 'KEFIR_CULTURE_REGISTERED', 'KEFIR_BATCH_CREATED',
    'FERMENTATION_RECORDED', 'QUALITY_CHECK_RECORDED', 'BATCH_RELEASED',
    'CONTAINER_DISTRIBUTED', 'CONTAINER_RETURNED', 'CONTAINER_SANITIZED', 'CONTAINER_REUSED',
  ];
  let previousEventIds = [];
  types.forEach((eventType, index) => {
    const event = signEvent({
      schemaVersion: '1.0.0',
      eventId: `MZ-KEFIR-EVT-DEMO-${index + 1}`,
      ventureId: 'MZ-VENTURE-KEFIR-001',
      pilotId: 'MZ-KEFIR-PILOT-001',
      eventType,
      occurredAt: new Date(Date.UTC(2026, 8, 10, 8, index)).toISOString(),
      actor,
      subjects: {
        processVersion: '0.1-synthetic',
        cultureId: 'MZ-KEFIR-CULTURE-SYNTHETIC-001',
        productLotId: 'MZ-KEFIR-LOT-SYNTHETIC-001',
        containerId: index >= 6 ? 'MZ-KEFIR-CONTAINER-SYNTHETIC-001' : undefined,
      },
      measurements: [{ metric: 'quantity', value: 1, unit: 'synthetic-unit', method: 'demo-only' }],
      evidence: [],
      previousEventIds,
      verification: { state: 'SIGNED', synthetic: true },
    }, keys.privateKey, actor.keyId);
    ledger.append(event);
    previousEventIds = [event.eventId];
  });
  const manifest = ledger.manifest();
  const lastIndex = manifest.eventCount - 1;
  const proof = createMerkleProof(manifest.tree, lastIndex);
  return {
    ok: true,
    synthetic: true,
    foodDistributed: false,
    healthClaim: false,
    eventCount: manifest.eventCount,
    merkleRoot: manifest.merkleRoot,
    finalEventProofValid: verifyMerkleProof(manifest.eventHashes[lastIndex], proof, manifest.merkleRoot),
    containerState: ledger.containerState.get('MZ-KEFIR-CONTAINER-SYNTHETIC-001'),
  };
}

module.exports = {
  EVENT_TYPES,
  KefirPilotLedger,
  canonicalize,
  createSyntheticKefirDemo,
  validateKefirEvent,
};
