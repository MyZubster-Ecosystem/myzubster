const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const {
  createChallenge,
  verifyChallengeSignature
} = require('./challenge.cjs');

test('accepts a valid wallet signature', async () => {
  const wallet = ethers.Wallet.createRandom();
  const now = new Date('2026-08-23T12:00:00.000Z');
  const challenge = createChallenge({
    userId: 'user-123',
    address: wallet.address,
    chainId: 11155111,
    now,
    nonce: 'abc123'
  });
  const signature = await wallet.signMessage(challenge.message);
  const result = verifyChallengeSignature({ challenge, signature, now });
  assert.equal(result.ok, true);
  assert.equal(result.address, wallet.address.toLowerCase());
});

test('rejects a signature from a different wallet', async () => {
  const owner = ethers.Wallet.createRandom();
  const attacker = ethers.Wallet.createRandom();
  const now = new Date('2026-08-23T12:00:00.000Z');
  const challenge = createChallenge({
    userId: 'user-123',
    address: owner.address,
    chainId: 11155111,
    now,
    nonce: 'abc123'
  });
  const signature = await attacker.signMessage(challenge.message);
  const result = verifyChallengeSignature({ challenge, signature, now });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'signature_mismatch');
});

test('rejects an expired challenge', async () => {
  const wallet = ethers.Wallet.createRandom();
  const issuedAt = new Date('2026-08-23T12:00:00.000Z');
  const challenge = createChallenge({
    userId: 'user-123',
    address: wallet.address,
    chainId: 11155111,
    now: issuedAt,
    ttlMs: 1000,
    nonce: 'abc123'
  });
  const signature = await wallet.signMessage(challenge.message);
  const result = verifyChallengeSignature({
    challenge,
    signature,
    now: new Date('2026-08-23T12:00:02.000Z')
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'expired');
});

test('binds the signature to user, chain, nonce and expiry through the signed message', async () => {
  const wallet = ethers.Wallet.createRandom();
  const now = new Date('2026-08-23T12:00:00.000Z');
  const original = createChallenge({
    userId: 'user-123',
    address: wallet.address,
    chainId: 11155111,
    now,
    nonce: 'abc123'
  });
  const signature = await wallet.signMessage(original.message);
  const altered = createChallenge({
    userId: 'user-456',
    address: wallet.address,
    chainId: 1,
    now,
    nonce: 'different'
  });
  const result = verifyChallengeSignature({ challenge: altered, signature, now });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'signature_mismatch');
});
