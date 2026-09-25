'use strict';

const crypto = require('crypto');
const { getAddress, verifyMessage } = require('ethers');

const LINK_ACTION = 'LINK_WALLET';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function normalizeAddress(address) {
  try {
    return getAddress(String(address || '').trim());
  } catch (_error) {
    const error = new Error('Indirizzo EVM non valido');
    error.code = 'INVALID_EVM_ADDRESS';
    throw error;
  }
}

function normalizeChainId(value) {
  const chainId = Number(value);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    const error = new Error('Chain ID non valido');
    error.code = 'INVALID_CHAIN_ID';
    throw error;
  }
  return chainId;
}

function createLinkChallenge({
  userId,
  address,
  chainId,
  domain = process.env.MYZUBSTER_WALLET_DOMAIN || 'www.myzubster.com',
  uri = process.env.MYZUBSTER_PUBLIC_URL || 'https://www.myzubster.com',
  now = new Date(),
  ttlMs = DEFAULT_TTL_MS
}) {
  const normalizedAddress = normalizeAddress(address);
  const normalizedChainId = normalizeChainId(chainId);
  const issuedAt = new Date(now);
  const expiresAt = new Date(issuedAt.getTime() + ttlMs);
  const nonce = crypto.randomBytes(16).toString('hex');

  const message = [
    `${domain} wants you to link your Ethereum account to MyZubster:`,
    normalizedAddress,
    '',
    'Sign this message to prove wallet control. This is not a payment and does not spend ETH.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${normalizedChainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expiresAt.toISOString()}`,
    `Request ID: ${LINK_ACTION}:${String(userId)}`
  ].join('\n');

  return {
    public: {
      address: normalizedAddress,
      chainId: normalizedChainId,
      message,
      issuedAt,
      expiresAt,
      action: LINK_ACTION
    },
    stored: {
      address: normalizedAddress,
      chainId: normalizedChainId,
      nonceHash: sha256(nonce),
      messageHash: sha256(message),
      issuedAt,
      expiresAt,
      action: LINK_ACTION
    }
  };
}

function verifyLinkChallenge({ challenge, address, message, signature, now = new Date() }) {
  if (!challenge || challenge.action !== LINK_ACTION) {
    const error = new Error('Challenge wallet non disponibile');
    error.code = 'WALLET_CHALLENGE_MISSING';
    throw error;
  }
  if (!challenge.expiresAt || new Date(challenge.expiresAt).getTime() <= new Date(now).getTime()) {
    const error = new Error('Challenge wallet scaduto');
    error.code = 'WALLET_CHALLENGE_EXPIRED';
    throw error;
  }

  const normalizedAddress = normalizeAddress(address);
  if (normalizedAddress !== normalizeAddress(challenge.address)) {
    const error = new Error('Il wallet non corrisponde al challenge');
    error.code = 'WALLET_ADDRESS_MISMATCH';
    throw error;
  }
  if (sha256(message) !== String(challenge.messageHash || '')) {
    const error = new Error('Messaggio di verifica non valido');
    error.code = 'WALLET_MESSAGE_MISMATCH';
    throw error;
  }

  let recovered;
  try {
    recovered = normalizeAddress(verifyMessage(String(message), String(signature || '')));
  } catch (_error) {
    const error = new Error('Firma wallet non valida');
    error.code = 'INVALID_WALLET_SIGNATURE';
    throw error;
  }
  if (recovered !== normalizedAddress) {
    const error = new Error('La firma appartiene a un wallet diverso');
    error.code = 'WALLET_SIGNER_MISMATCH';
    throw error;
  }

  return { address: normalizedAddress, chainId: normalizeChainId(challenge.chainId), recovered };
}

module.exports = {
  LINK_ACTION,
  DEFAULT_TTL_MS,
  sha256,
  normalizeAddress,
  normalizeChainId,
  createLinkChallenge,
  verifyLinkChallenge
};
