#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const { JsonRpcProvider, toUtf8String } = require('ethers');

const PREFIX = 'MZ-HANDOVER-V1:';
const SCHEMA = 'myzubster.marketplace-handover.v1';
const EXPECTED_CHAIN_ID = 84532n;

function canonicalPayload(input) {
  return {
    schema: SCHEMA,
    handoverId: String(input.handoverId),
    listingId: String(input.listingId),
    method: input.method,
    state: input.state,
    handedOverAt: input.handedOverAt ? new Date(input.handedOverAt).toISOString() : null,
    receivedAt: input.receivedAt ? new Date(input.receivedAt).toISOString() : null,
    recordedAt: input.recordedAt ? new Date(input.recordedAt).toISOString() : null
  };
}

// Preserve the exact v1 serialization used by the already-anchored handover schema.
function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function verifyHandoverCommitment({ rpcUrl, txId, handover }) {
  if (!rpcUrl) throw new Error('RPC URL is required');
  if (!txId) throw new Error('Transaction ID is required');
  if (!handover) throw new Error('Handover payload is required');

  const payload = canonicalPayload(handover);
  const canonical = canonicalJson(payload);
  const commitment = sha256(canonical);
  const expectedMessage = `${PREFIX}${commitment}`;

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    return { match: false, reason: 'CHAIN_ID_MISMATCH', expectedChainId: Number(EXPECTED_CHAIN_ID), actualChainId: Number(network.chainId), commitment, payload };
  }

  const tx = await provider.getTransaction(txId);
  if (!tx) return { match: false, reason: 'TRANSACTION_NOT_FOUND', commitment, payload };

  const receipt = await provider.getTransactionReceipt(txId);
  if (!receipt || receipt.status !== 1) {
    return { match: false, reason: 'TRANSACTION_NOT_CONFIRMED', commitment, payload };
  }

  let message;
  try {
    message = toUtf8String(tx.data);
  } catch {
    return { match: false, reason: 'CALLDATA_NOT_UTF8', commitment, payload, blockNumber: receipt.blockNumber };
  }

  const match = message === expectedMessage;
  return {
    match,
    reason: match ? 'MATCH' : 'COMMITMENT_MISMATCH',
    chainId: Number(network.chainId),
    txId: tx.hash,
    blockNumber: receipt.blockNumber,
    commitment,
    expectedMessage,
    actualMessage: message,
    payload
  };
}

function usage() {
  console.error('Usage: node scripts/verify-handover-commitment.js <handover.json> <txId>');
  console.error('RPC: MARKETPLACE_BASE_RPC_URL or BASE_SEPOLIA_RPC_URL');
}

async function main() {
  const [jsonPath, txId] = process.argv.slice(2);
  if (!jsonPath || !txId) {
    usage();
    process.exitCode = 2;
    return;
  }

  const rpcUrl = process.env.MARKETPLACE_BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL;
  if (!rpcUrl) throw new Error('Set MARKETPLACE_BASE_RPC_URL or BASE_SEPOLIA_RPC_URL');

  const handover = require(require('path').resolve(jsonPath));
  const result = await verifyHandoverCommitment({ rpcUrl, txId, handover });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.match ? 0 : 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ match: false, reason: 'VERIFIER_ERROR', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = { canonicalPayload, canonicalJson, sha256, verifyHandoverCommitment };
