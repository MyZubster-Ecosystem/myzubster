'use strict';

const crypto = require('crypto');
const { verifyMessage } = require('ethers');
const { normalizeAddress, normalizeChainId, sha256 } = require('./evmWalletLinkService');

const REQUEST_ACTION = 'MARKETPLACE_REQUEST';
const REQUEST_SCHEMA = 'myzubster.marketplace-request.v1';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    const error = new Error('Quantità Marketplace non valida');
    error.code = 'INVALID_MARKETPLACE_QUANTITY';
    throw error;
  }
  return quantity;
}

function listingSnapshot(listing) {
  return {
    title: String(listing?.title || '').slice(0, 180),
    price: Number(listing?.price || 0),
    currency: String(listing?.currency || '').toUpperCase(),
    exchangeMode: String(listing?.exchangeMode || ''),
    sellerId: String(listing?.ownerId || '')
  };
}

function createMarketplaceRequestChallenge({
  userId,
  walletAddress,
  chainId,
  listing,
  quantity,
  domain = process.env.MYZUBSTER_WALLET_DOMAIN || 'www.myzubster.com',
  uri = process.env.MYZUBSTER_PUBLIC_URL || 'https://www.myzubster.com',
  now = new Date(),
  ttlMs = DEFAULT_TTL_MS
}) {
  if (!listing?._id) {
    const error = new Error('Annuncio Marketplace non valido');
    error.code = 'INVALID_MARKETPLACE_LISTING';
    throw error;
  }

  const address = normalizeAddress(walletAddress);
  const normalizedChainId = normalizeChainId(chainId);
  const normalizedQuantity = normalizeQuantity(quantity);
  const issuedAt = new Date(now);
  const expiresAt = new Date(issuedAt.getTime() + ttlMs);
  const nonce = crypto.randomBytes(16).toString('hex');
  const snapshot = listingSnapshot(listing);

  const payload = {
    schema: REQUEST_SCHEMA,
    intent: REQUEST_ACTION,
    domain,
    uri,
    listingId: String(listing._id),
    quantity: normalizedQuantity,
    buyerAccountReference: String(userId),
    walletAddress: address,
    chainId: normalizedChainId,
    listingSnapshot: snapshot,
    listingSnapshotHash: sha256(JSON.stringify(snapshot)),
    nonce,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const canonicalPayload = JSON.stringify(payload);
  const message = [
    'MyZubster Marketplace request',
    '',
    canonicalPayload,
    '',
    'Signing creates a Marketplace request intent only. It is not a payment, does not transfer ETH, and does not guarantee seller acceptance.'
  ].join('\n');

  return {
    public: {
      payload,
      message,
      expiresAt,
      action: REQUEST_ACTION
    },
    stored: {
      userId,
      action: REQUEST_ACTION,
      walletAddress: address,
      chainId: normalizedChainId,
      listingId: listing._id,
      quantity: normalizedQuantity,
      payload,
      payloadHash: sha256(canonicalPayload),
      message,
      messageHash: sha256(message),
      nonceHash: sha256(nonce),
      issuedAt,
      expiresAt
    }
  };
}

function verifyMarketplaceRequestChallenge({
  challenge,
  expectedUserId,
  expectedListingId,
  expectedQuantity,
  currentWalletAddress,
  signature,
  now = new Date()
}) {
  if (!challenge || challenge.action !== REQUEST_ACTION) {
    const error = new Error('Challenge Marketplace non disponibile');
    error.code = 'MARKETPLACE_CHALLENGE_MISSING';
    throw error;
  }
  if (challenge.consumedAt) {
    const error = new Error('Challenge Marketplace già utilizzato');
    error.code = 'MARKETPLACE_CHALLENGE_CONSUMED';
    throw error;
  }
  if (!challenge.expiresAt || new Date(challenge.expiresAt).getTime() <= new Date(now).getTime()) {
    const error = new Error('Challenge Marketplace scaduto');
    error.code = 'MARKETPLACE_CHALLENGE_EXPIRED';
    throw error;
  }
  if (String(challenge.userId) !== String(expectedUserId)) {
    const error = new Error('Challenge Marketplace associato a un altro account');
    error.code = 'MARKETPLACE_CHALLENGE_USER_MISMATCH';
    throw error;
  }
  if (String(challenge.listingId) !== String(expectedListingId)) {
    const error = new Error('Challenge Marketplace associato a un altro annuncio');
    error.code = 'MARKETPLACE_CHALLENGE_LISTING_MISMATCH';
    throw error;
  }
  if (normalizeQuantity(challenge.quantity) !== normalizeQuantity(expectedQuantity)) {
    const error = new Error('Quantità diversa da quella firmata');
    error.code = 'MARKETPLACE_CHALLENGE_QUANTITY_MISMATCH';
    throw error;
  }

  const walletAddress = normalizeAddress(currentWalletAddress);
  if (normalizeAddress(challenge.walletAddress) !== walletAddress) {
    const error = new Error('Il wallet verificato non corrisponde al wallet che ha creato il challenge');
    error.code = 'MARKETPLACE_WALLET_MISMATCH';
    throw error;
  }
  if (sha256(JSON.stringify(challenge.payload)) !== String(challenge.payloadHash || '')) {
    const error = new Error('Payload Marketplace non integro');
    error.code = 'MARKETPLACE_PAYLOAD_MISMATCH';
    throw error;
  }
  if (sha256(String(challenge.message || '')) !== String(challenge.messageHash || '')) {
    const error = new Error('Messaggio Marketplace non integro');
    error.code = 'MARKETPLACE_MESSAGE_MISMATCH';
    throw error;
  }

  let recovered;
  try {
    recovered = normalizeAddress(verifyMessage(String(challenge.message), String(signature || '')));
  } catch (_error) {
    const error = new Error('Firma Marketplace non valida');
    error.code = 'INVALID_MARKETPLACE_SIGNATURE';
    throw error;
  }
  if (recovered !== walletAddress) {
    const error = new Error('La firma Marketplace appartiene a un wallet diverso');
    error.code = 'MARKETPLACE_SIGNER_MISMATCH';
    throw error;
  }

  return {
    walletAddress,
    chainId: normalizeChainId(challenge.chainId),
    payloadHash: String(challenge.payloadHash),
    signedAt: new Date(now)
  };
}

module.exports = {
  REQUEST_ACTION,
  REQUEST_SCHEMA,
  DEFAULT_TTL_MS,
  normalizeQuantity,
  listingSnapshot,
  createMarketplaceRequestChallenge,
  verifyMarketplaceRequestChallenge
};
