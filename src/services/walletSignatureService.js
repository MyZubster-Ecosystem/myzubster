const crypto = require('crypto');
const { getAddress, verifyMessage } = require('ethers');

function normalizeAddress(address) {
  return getAddress(String(address || '').trim()).toLowerCase();
}

function createNonce() {
  return crypto.randomBytes(32).toString('hex');
}

function buildLinkMessage({
  userId,
  walletAddress,
  nonce,
  issuedAt,
  expiresAt
}) {
  return [
    'MyZubster Wallet Verification',
    '',
    'Action: LINK_WALLET',
    `Account: ${userId}`,
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`,
    '',
    'Signing this message does not authorize a payment or blockchain transaction.'
  ].join('\n');
}

function recoverAddress(message, signature) {
  return normalizeAddress(
    verifyMessage(message, signature)
  );
}

module.exports = {
  normalizeAddress,
  createNonce,
  buildLinkMessage,
  recoverAddress
};
