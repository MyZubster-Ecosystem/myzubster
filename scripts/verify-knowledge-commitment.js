const fs = require('fs');
const crypto = require('crypto');

const PREFIX = 'MZ-KNOWLEDGE-V1:';
const SCHEMA = 'myzubster.knowledge-transfer.v1';
const EXPECTED_CHAIN_ID = 84532n;
const EVIDENCE_SINK = '0x000000000000000000000000000000000000dead';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function buildCommitment(manifest) {
  if (!manifest || manifest.schema !== SCHEMA) {
    throw new Error(`Expected manifest schema ${SCHEMA}`);
  }
  const hash = sha256(canonicalJson(manifest));
  return { hash, payload: `${PREFIX}${hash}` };
}

async function verifyTransaction(manifest, txId) {
  const { JsonRpcProvider, toUtf8String } = require('ethers');
  const { hash, payload } = buildCommitment(manifest);
  const rpcUrl = process.env.MARKETPLACE_BASE_RPC_URL
    || process.env.BASE_SEPOLIA_RPC_URL
    || 'https://sepolia.base.org';
  const provider = new JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), { staticNetwork: true });
  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Unexpected chain id ${network.chainId}`);
  }

  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txId),
    provider.getTransactionReceipt(txId)
  ]);
  if (!tx) throw new Error('Transaction not found');
  if (!receipt) throw new Error('Transaction receipt not found');
  if (receipt.status !== 1) throw new Error('Transaction was not successful');
  if (tx.value !== 0n) throw new Error('Knowledge anchor transaction must have 0 ETH value');
  if (String(tx.to || '').toLowerCase() !== EVIDENCE_SINK) {
    throw new Error(`Unexpected evidence sink: ${tx.to}`);
  }

  let decoded;
  try {
    decoded = toUtf8String(tx.data);
  } catch (error) {
    throw new Error(`Transaction calldata is not valid UTF-8: ${error.message}`);
  }
  if (decoded !== payload) {
    throw new Error(`Calldata mismatch: expected ${payload}, got ${decoded}`);
  }

  const block = await provider.getBlock(receipt.blockNumber);
  return {
    match: true,
    schema: SCHEMA,
    hash,
    payload,
    network: 'base-sepolia',
    chainId: Number(network.chainId),
    txId: tx.hash,
    blockNumber: receipt.blockNumber,
    confirmedAt: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString()
  };
}

function usage() {
  console.error('Usage: node scripts/verify-knowledge-commitment.js <manifest.json> [txId]');
  console.error('RPC: MARKETPLACE_BASE_RPC_URL or BASE_SEPOLIA_RPC_URL (defaults to https://sepolia.base.org)');
}

async function main() {
  const manifestPath = process.argv[2];
  const txId = process.argv[3];
  if (!manifestPath) {
    usage();
    process.exitCode = 2;
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!txId) {
    const commitment = buildCommitment(manifest);
    console.log(JSON.stringify({
      status: 'PREPARED',
      schema: SCHEMA,
      algorithm: 'SHA-256',
      ...commitment,
      network: 'base-sepolia',
      chainId: Number(EXPECTED_CHAIN_ID)
    }, null, 2));
    return;
  }

  const result = await verifyTransaction(manifest, txId);
  console.log(JSON.stringify({ status: 'MATCH', ...result }, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
}

module.exports = {
  PREFIX,
  SCHEMA,
  EXPECTED_CHAIN_ID,
  EVIDENCE_SINK,
  canonicalize,
  canonicalJson,
  sha256,
  buildCommitment,
  verifyTransaction
};
