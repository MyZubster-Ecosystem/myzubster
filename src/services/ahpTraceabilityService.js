const crypto = require('crypto');

const EVENT_TYPES = new Set([
  'DESIGN_VERSION_PUBLISHED', 'LOT_CREATED', 'LOT_SUPPLIED',
  'COLLECTION_RECORDED', 'TRANSPORT_TRANSFERRED', 'TREATMENT_ACCEPTED',
  'TREATMENT_COMPLETED', 'FRACTION_RECOVERED', 'DESTINATION_CONFIRMED',
  'CORRECTION_ISSUED', 'ANCHOR_PUBLISHED',
]);

const FORBIDDEN_KEYS = /^(name|email|phone|address|medical|health|menstrual|continence|disability|patient|consumer)$/i;

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

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

function unsignedEvent(event) {
  const copy = JSON.parse(JSON.stringify(event));
  delete copy.signature;
  delete copy.anchor;
  return copy;
}

function validateEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object' || Array.isArray(event)) return ['event must be an object'];
  if (event.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (!/^MZ-AHP-EVT-[A-Za-z0-9_-]+$/.test(event.eventId || '')) errors.push('invalid eventId');
  if (event.ventureId !== 'MZ-VENTURE-AHP-001') errors.push('invalid ventureId');
  if (!event.pilotId) errors.push('pilotId is required');
  if (!EVENT_TYPES.has(event.eventType)) errors.push('invalid eventType');
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) errors.push('valid occurredAt is required');
  if (!event.actor?.actorId || !event.actor?.role || !event.actor?.keyId) errors.push('complete actor is required');
  if (!event.subjects || typeof event.subjects !== 'object') errors.push('subjects are required');
  if (!Array.isArray(event.evidence)) errors.push('evidence must be an array');
  if (!event.verification?.state) errors.push('verification state is required');
  if (!event.signature?.algorithm || !event.signature?.keyId || !event.signature?.value) errors.push('signature is required');
  const forbidden = findForbiddenKey(event);
  if (forbidden) errors.push(`personal or health data key is forbidden: ${forbidden}`);
  return errors;
}

function generateSigningKeyPair() {
  return crypto.generateKeyPairSync('ed25519');
}

function signEvent(event, privateKey, keyId) {
  const body = unsignedEvent(event);
  const signature = crypto.sign(null, Buffer.from(canonicalize(body)), privateKey).toString('base64');
  return { ...body, signature: { algorithm: 'Ed25519', keyId, value: signature } };
}

function verifyEventSignature(event, publicKey) {
  if (event.signature?.algorithm !== 'Ed25519') return false;
  return crypto.verify(
    null,
    Buffer.from(canonicalize(unsignedEvent(event))),
    publicKey,
    Buffer.from(event.signature.value, 'base64'),
  );
}

function eventHash(event) {
  return sha256(canonicalize(event));
}

function merkleParent(left, right) {
  return sha256(`MZ-AHP-MERKLE-NODE:${left}:${right}`);
}

function merkleLeaf(hash) {
  return sha256(`MZ-AHP-MERKLE-LEAF:${hash}`);
}

function buildMerkleTree(hashes) {
  if (!hashes.length) throw new Error('at least one hash is required');
  const levels = [hashes.map(merkleLeaf)];
  while (levels.at(-1).length > 1) {
    const current = levels.at(-1);
    const next = [];
    for (let i = 0; i < current.length; i += 2) next.push(merkleParent(current[i], current[i + 1] || current[i]));
    levels.push(next);
  }
  return { root: levels.at(-1)[0], levels };
}

function createMerkleProof(tree, index) {
  if (index < 0 || index >= tree.levels[0].length) throw new Error('invalid leaf index');
  const proof = [];
  let cursor = index;
  for (let level = 0; level < tree.levels.length - 1; level += 1) {
    const nodes = tree.levels[level];
    const siblingIndex = cursor % 2 ? cursor - 1 : cursor + 1;
    proof.push({ hash: nodes[siblingIndex] || nodes[cursor], position: cursor % 2 ? 'left' : 'right' });
    cursor = Math.floor(cursor / 2);
  }
  return proof;
}

function verifyMerkleProof(hash, proof, root) {
  let current = merkleLeaf(hash);
  for (const item of proof) current = item.position === 'left' ? merkleParent(item.hash, current) : merkleParent(current, item.hash);
  return current === root;
}

class InMemoryAppendOnlyLedger {
  constructor({ resolvePublicKey }) {
    this.resolvePublicKey = resolvePublicKey;
    this.events = [];
    this.ids = new Set();
  }

  append(event) {
    const errors = validateEvent(event);
    if (errors.length) throw new Error(errors.join('; '));
    if (this.ids.has(event.eventId)) throw new Error('duplicate eventId');
    const publicKey = this.resolvePublicKey(event.actor.keyId);
    if (!publicKey || !verifyEventSignature(event, publicKey)) throw new Error('invalid event signature');
    for (const previousId of event.previousEventIds || []) if (!this.ids.has(previousId)) throw new Error(`unknown previous event: ${previousId}`);
    const record = Object.freeze({ event: Object.freeze(event), hash: eventHash(event), sequence: this.events.length + 1 });
    this.events.push(record);
    this.ids.add(event.eventId);
    return record;
  }

  manifest() {
    const hashes = this.events.map(record => record.hash);
    const tree = buildMerkleTree(hashes);
    return { schemaVersion: '1.0.0', eventCount: hashes.length, eventHashes: hashes, merkleRoot: tree.root, tree };
  }
}

class MockAnchorAdapter {
  constructor({ network = 'local-testnet', chainId = 'myzubster-ahp-test-1' } = {}) {
    this.network = network;
    this.chainId = chainId;
  }

  async anchor(manifest) {
    const manifestHash = sha256(canonicalize({ schemaVersion: manifest.schemaVersion, eventHashes: manifest.eventHashes, merkleRoot: manifest.merkleRoot }));
    return {
      anchorBatchId: `MZ-AHP-ANCHOR-${manifestHash.slice(0, 16)}`,
      network: this.network,
      chainId: this.chainId,
      merkleRoot: manifest.merkleRoot,
      transactionId: `mock:${manifestHash}`,
      blockReference: null,
      confirmationState: 'CONFIRMED',
      simulated: true,
    };
  }
}

class EvmCalldataAnchorAdapter {
  constructor({ rpcUrl, privateKey, chainId, network = 'evm-testnet', confirmations = 1 } = {}) {
    if (!rpcUrl || !privateKey || !chainId) throw new Error('rpcUrl, privateKey and chainId are required');
    this.rpcUrl = rpcUrl;
    this.privateKey = privateKey;
    this.chainId = BigInt(chainId);
    this.network = network;
    this.confirmations = confirmations;
  }

  async anchor(manifest) {
    const { JsonRpcProvider, Wallet, toUtf8Bytes, hexlify } = require('ethers');
    const provider = new JsonRpcProvider(this.rpcUrl);
    const actual = await provider.getNetwork();
    if (actual.chainId !== this.chainId) throw new Error(`unexpected chainId: ${actual.chainId}`);
    const wallet = new Wallet(this.privateKey, provider);
    const payload = hexlify(toUtf8Bytes(`MZ-AHP-V1:${manifest.merkleRoot}`));
    const transaction = await wallet.sendTransaction({ to: wallet.address, value: 0, data: payload });
    const receipt = await transaction.wait(this.confirmations);
    return {
      anchorBatchId: `MZ-AHP-ANCHOR-${manifest.merkleRoot.slice(0, 16)}`,
      network: this.network,
      chainId: actual.chainId.toString(),
      merkleRoot: manifest.merkleRoot,
      transactionId: transaction.hash,
      blockReference: String(receipt.blockNumber),
      confirmationState: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
      simulated: false,
    };
  }
}

module.exports = {
  EvmCalldataAnchorAdapter, InMemoryAppendOnlyLedger, MockAnchorAdapter, buildMerkleTree, canonicalize,
  createMerkleProof, eventHash, findForbiddenKey, generateSigningKeyPair,
  sha256, signEvent, validateEvent, verifyEventSignature, verifyMerkleProof,
};
