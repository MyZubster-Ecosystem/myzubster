const { Wallet } = require('ethers');

const {
  normalizeAddress,
  createNonce,
  buildLinkMessage,
  recoverAddress
} = require('../src/services/walletSignatureService');

describe('MyZubster wallet signature service', () => {
  test('verifies the wallet that signed the challenge', async () => {
    const wallet = Wallet.createRandom();

    const issuedAt = new Date('2026-09-16T08:00:00Z');
    const expiresAt = new Date('2026-09-16T08:05:00Z');

    const message = buildLinkMessage({
      userId: 'user-test',
      walletAddress: normalizeAddress(wallet.address),
      nonce: createNonce(),
      issuedAt,
      expiresAt
    });

    const signature = await wallet.signMessage(message);

    expect(recoverAddress(message, signature))
      .toBe(normalizeAddress(wallet.address));
  });

  test('detects a signature made by another wallet', async () => {
    const expectedWallet = Wallet.createRandom();
    const attackerWallet = Wallet.createRandom();

    const issuedAt = new Date('2026-09-16T08:00:00Z');
    const expiresAt = new Date('2026-09-16T08:05:00Z');

    const message = buildLinkMessage({
      userId: 'user-test',
      walletAddress: normalizeAddress(expectedWallet.address),
      nonce: createNonce(),
      issuedAt,
      expiresAt
    });

    const signature = await attackerWallet.signMessage(message);

    expect(recoverAddress(message, signature))
      .not.toBe(normalizeAddress(expectedWallet.address));
  });

  test('creates unique nonces', () => {
    const first = createNonce();
    const second = createNonce();

    expect(first).not.toBe(second);
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
  });

  test('message explicitly says signature is not payment authorization', () => {
    const wallet = Wallet.createRandom();

    const message = buildLinkMessage({
      userId: 'user-test',
      walletAddress: normalizeAddress(wallet.address),
      nonce: createNonce(),
      issuedAt: new Date('2026-09-16T08:00:00Z'),
      expiresAt: new Date('2026-09-16T08:05:00Z')
    });

    expect(message).toContain(
      'does not authorize a payment or blockchain transaction'
    );
  });
});
