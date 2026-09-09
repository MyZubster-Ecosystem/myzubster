const express = require('express');
const crypto = require('crypto');
const AhpTraceEvent = require('../models/AhpTraceEvent');
const { MongoAhpTraceStore } = require('../services/ahpTraceStore');
const { EvmCalldataAnchorAdapter, InMemoryAppendOnlyLedger, MockAnchorAdapter,
  createMerkleProof, generateSigningKeyPair, signEvent, verifyMerkleProof } = require('../services/ahpTraceabilityService');

const router = express.Router();

function authorized(req) {
  const secret = process.env.AHP_TRACE_INGEST_TOKEN;
  return Boolean(secret && req.headers.authorization === `Bearer ${secret}`);
}

function keyRegistry() {
  try {
    const entries = JSON.parse(process.env.AHP_TRACE_PUBLIC_KEYS_JSON || '{}');
    return keyId => entries[keyId] ? crypto.createPublicKey(entries[keyId]) : null;
  } catch (_error) { return () => null; }
}

function store() { return new MongoAhpTraceStore({ model: AhpTraceEvent, resolvePublicKey: keyRegistry() }); }

router.get('/health', (_req, res) => res.json({ ok: true, service: 'MyZubster AHP Traceability',
  schemaVersion: '1.0.0', persistence: 'mongodb', personalOrHealthDataOnChain: false,
  realAnchorConfigured: Boolean(process.env.AHP_TRACE_EVM_RPC_URL && process.env.AHP_TRACE_EVM_PRIVATE_KEY && process.env.AHP_TRACE_EVM_CHAIN_ID) }));

router.get('/demo', async (_req, res) => {
  const keys = generateSigningKeyPair();
  const actor = { actorId: 'synthetic-pilot-operator', role: 'PILOT_ADMIN', keyId: 'ephemeral-demo-key' };
  const ledger = new InMemoryAppendOnlyLedger({ resolvePublicKey: () => keys.publicKey });
  const types = ['DESIGN_VERSION_PUBLISHED', 'LOT_CREATED', 'LOT_SUPPLIED', 'COLLECTION_RECORDED', 'TRANSPORT_TRANSFERRED', 'TREATMENT_COMPLETED', 'DESTINATION_CONFIRMED'];
  let previousEventIds = [];
  for (let index = 0; index < types.length; index += 1) {
    const event = signEvent({ schemaVersion: '1.0.0', eventId: `MZ-AHP-EVT-DEMO-${index + 1}`,
      ventureId: 'MZ-VENTURE-AHP-001', pilotId: 'MZ-AHP-PILOT-SYNTHETIC', eventType: types[index],
      occurredAt: new Date(Date.UTC(2026, 8, 9, 0, index)).toISOString(), actor,
      subjects: { designModelId: 'MZ-AHP-OS-001', designVersion: '0.2-draft', productLotId: 'LOT-SYNTHETIC-001' },
      measurements: [{ metric: 'mass', value: 10 - index, unit: 'kg', method: 'synthetic-demo-only' }],
      evidence: [], previousEventIds, verification: { state: 'SIGNED' } }, keys.privateKey, actor.keyId);
    ledger.append(event);
    previousEventIds = [event.eventId];
  }
  const manifest = ledger.manifest();
  const anchor = await new MockAnchorAdapter().anchor(manifest);
  const proof = createMerkleProof(manifest.tree, manifest.eventCount - 1);
  res.json({ ok: true, synthetic: true, persisted: false, blockchainTransaction: false,
    manifest: { schemaVersion: manifest.schemaVersion, eventCount: manifest.eventCount, eventHashes: manifest.eventHashes, merkleRoot: manifest.merkleRoot },
    anchor, finalEventProofValid: verifyMerkleProof(manifest.eventHashes.at(-1), proof, manifest.merkleRoot) });
});

router.post('/events', async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'AHP trace ingest not authorized' });
  try { const record = await store().append(req.body); return res.status(201).json({ ok: true, record, blockchainTransaction: false }); }
  catch (error) { return res.status(400).json({ ok: false, error: error.message }); }
});

router.get('/lots/:productLotId', async (req, res) => {
  const events = await store().publicLot(req.params.productLotId);
  if (!events.length) return res.status(404).json({ ok: false, error: 'lot not found' });
  return res.json({ ok: true, productLotId: req.params.productLotId, events });
});

router.post('/anchors', async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'AHP trace anchoring not authorized' });
  try {
    const manifest = await store().manifest({ pilotId: req.body.pilotId, productLotId: req.body.productLotId });
    if (!manifest) return res.status(404).json({ ok: false, error: 'no events found' });
    const adapter = new EvmCalldataAnchorAdapter({ rpcUrl: process.env.AHP_TRACE_EVM_RPC_URL,
      privateKey: process.env.AHP_TRACE_EVM_PRIVATE_KEY, chainId: process.env.AHP_TRACE_EVM_CHAIN_ID,
      network: process.env.AHP_TRACE_EVM_NETWORK || 'evm-testnet' });
    return res.status(201).json({ ok: true, receipt: await adapter.anchor(manifest) });
  } catch (error) { return res.status(503).json({ ok: false, error: error.message, blockchainTransactionConfirmed: false }); }
});

module.exports = router;
