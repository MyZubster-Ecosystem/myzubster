const crypto = require('crypto');
const { ethers } = require('ethers');

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function normalizeAddress(address) {
  return ethers.getAddress(address).toLowerCase();
}

function createChallenge({ userId, address, chainId, now = new Date(), ttlMs = DEFAULT_TTL_MS, nonce }) {
  if (!userId) throw new Error('userId is required');
  if (!address) throw new Error('address is required');
  if (!Number.isInteger(Number(chainId)) || Number(chainId) <= 0) throw new Error('valid chainId is required');

  const normalizedAddress = normalizeAddress(address);
  const challengeNonce = nonce || crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(now.getTime() + ttlMs);
  const message = [
    'MyZubster wallet verification',
    `User: ${userId}`,
    `Wallet: ${ethers.getAddress(normalizedAddress)}`,
    `Chain ID: ${Number(chainId)}`,
    `Nonce: ${challengeNonce}`,
    `Expires: ${expiresAt.toISOString()}`
  ].join('\n');

  return {
    userId: String(userId),
    address: normalizedAddress,
    chainId: Number(chainId),
    nonce: challengeNonce,
    expiresAt,
    message
  };
}

function verifyChallengeSignature({ challenge, signature, now = new Date() }) {
  if (!challenge || !challenge.message || !challenge.address || !challenge.expiresAt) {
    throw new Error('complete challenge is required');
  }
  if (!signature) throw new Error('signature is required');

  const expiresAt = new Date(challenge.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) throw new Error('invalid challenge expiry');
  if (expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const recovered = ethers.verifyMessage(challenge.message, signature).toLowerCase();
  const expected = normalizeAddress(challenge.address);
  if (recovered !== expected) {
    return { ok: false, reason: 'signature_mismatch', recovered };
  }

  return { ok: true, address: expected };
}

module.exports = {
  DEFAULT_TTL_MS,
  normalizeAddress,
  createChallenge,
  verifyChallengeSignature
};
