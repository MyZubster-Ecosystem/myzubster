const crypto = require('crypto');
const { recoverAddress } = require('./walletSignatureService');

function canonicalPayload(payload) {
  return JSON.stringify({
    schema: payload.schema,
    intent: payload.intent,
    listingId: String(payload.listingId),
    quantity: Number(payload.quantity),
    buyerId: String(payload.buyerId),
    walletAddress: String(payload.walletAddress).toLowerCase(),
    listingSnapshot: {
      price: Number(payload.listingSnapshot?.price),
      currency: String(payload.listingSnapshot?.currency || ''),
      exchangeMode: String(payload.listingSnapshot?.exchangeMode || '')
    },
    nonce: payload.nonce,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt
  });
}

function hashPayload(payload) {
  return crypto
    .createHash('sha256')
    .update(canonicalPayload(payload))
    .digest('hex');
}

function buildMarketplaceRequestMessage(payload) {
  return [
    'MyZubster Marketplace Request',
    '',
    `Schema: ${payload.schema}`,
    `Intent: ${payload.intent}`,
    `Listing: ${payload.listingId}`,
    `Quantity: ${payload.quantity}`,
    `Buyer: ${payload.buyerId}`,
    `Wallet: ${payload.walletAddress}`,
    `Price: ${payload.listingSnapshot?.price}`,
    `Currency: ${payload.listingSnapshot?.currency}`,
    `Exchange Mode: ${payload.listingSnapshot?.exchangeMode}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${payload.issuedAt}`,
    `Expires At: ${payload.expiresAt}`,
    `Payload Hash: ${hashPayload(payload)}`,
    '',
    'Signing creates a Marketplace request intent.',
    'It does not authorize payment or transfer blockchain assets.'
  ].join('\n');
}

function verifyMarketplaceRequest(message, signature) {
  return recoverAddress(message, signature);
}

module.exports = {
  canonicalPayload,
  hashPayload,
  buildMarketplaceRequestMessage,
  verifyMarketplaceRequest
};
