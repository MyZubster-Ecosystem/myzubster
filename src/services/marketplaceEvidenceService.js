const crypto = require('crypto');
const axios = require('axios');
const { anchorMarketplaceEvidenceOnBase } = require('./baseMarketplaceAnchorService');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      if (value[key] !== undefined) result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
}

function buildMarketplaceEvidence(order) {
  return canonicalize({
    schema: 'myzubster.marketplace.evidence.v1',
    orderId: String(order._id),
    listingId: String(order.listingId),
    buyerId: String(order.buyerId),
    sellerId: String(order.sellerId),
    quantity: order.quantity,
    status: order.status,
    snapshot: {
      title: order.snapshot?.title || '',
      price: Number(order.snapshot?.price || 0),
      currency: order.snapshot?.currency || '',
      exchangeMode: order.snapshot?.exchangeMode || ''
    },
    acceptedAt: order.acceptedAt ? new Date(order.acceptedAt).toISOString() : null,
    completedAt: order.completedAt ? new Date(order.completedAt).toISOString() : null,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null
  });
}

function hashMarketplaceEvidence(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(payload))).digest('hex');
}

async function requestExternalBlockchainAnchor(evidenceHash) {
  const endpoint = process.env.MARKETPLACE_BLOCKCHAIN_ANCHOR_URL;
  if (!endpoint) return { status: 'NOT_CONFIGURED' };

  const response = await axios.post(endpoint, {
    schema: 'myzubster.marketplace.anchor.v1',
    evidenceHash
  }, {
    timeout: Number(process.env.MARKETPLACE_BLOCKCHAIN_ANCHOR_TIMEOUT_MS || 10000),
    headers: process.env.MARKETPLACE_BLOCKCHAIN_ANCHOR_TOKEN
      ? { Authorization: `Bearer ${process.env.MARKETPLACE_BLOCKCHAIN_ANCHOR_TOKEN}` }
      : undefined
  });

  const txId = response.data?.txId || response.data?.txid || response.data?.transactionId;
  if (!txId) throw new Error('Blockchain anchor did not return a transaction id');

  return {
    status: response.data?.confirmed === true ? 'CONFIRMED' : 'SUBMITTED',
    txId: String(txId),
    network: String(response.data?.network || process.env.MARKETPLACE_BLOCKCHAIN_NETWORK || 'external'),
    anchoredAt: response.data?.anchoredAt ? new Date(response.data.anchoredAt) : new Date(),
    confirmedAt: response.data?.confirmedAt ? new Date(response.data.confirmedAt) : (response.data?.confirmed === true ? new Date() : null),
    explorerUrl: response.data?.explorerUrl ? String(response.data.explorerUrl) : null
  };
}

async function requestBlockchainAnchor(evidenceHash) {
  const provider = String(process.env.MARKETPLACE_BLOCKCHAIN_ANCHOR_PROVIDER || '').toLowerCase();
  if (provider === 'base-sepolia') return anchorMarketplaceEvidenceOnBase(evidenceHash);
  return requestExternalBlockchainAnchor(evidenceHash);
}

async function createMarketplaceEvidence(order) {
  const payload = buildMarketplaceEvidence(order);
  const evidenceHash = hashMarketplaceEvidence(payload);
  let anchor;
  try {
    anchor = await requestBlockchainAnchor(evidenceHash);
  } catch (error) {
    anchor = { status: 'FAILED', error: error.message };
  }
  return { payload, evidenceHash, algorithm: 'sha256', anchor };
}

function verifyMarketplaceEvidence(payload, expectedHash) {
  return hashMarketplaceEvidence(payload) === expectedHash;
}

module.exports = { buildMarketplaceEvidence, hashMarketplaceEvidence, createMarketplaceEvidence, verifyMarketplaceEvidence };
