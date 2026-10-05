'use strict';

const { validateWalletAddress, normalizeContributorWallets } = require('../src/services/contributorWalletService');

describe('contributorWalletService', () => {
  test('accepts supported public wallet address shapes', () => {
    expect(validateWalletAddress('ETH', '0x1111111111111111111111111111111111111111')).toBe(true);
    expect(validateWalletAddress('BTC', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT')).toBe(true);
    expect(validateWalletAddress('XMR', '4' + 'A'.repeat(94))).toBe(true);
  });

  test('rejects secrets and malformed addresses', () => {
    expect(validateWalletAddress('ETH', 'seed phrase words should never be stored')).toBe(false);
    expect(validateWalletAddress('BTC', 'not-a-wallet')).toBe(false);
    expect(validateWalletAddress('XMR', '4short')).toBe(false);
  });

  test('user input can never self-promote verification state', () => {
    const wallets = normalizeContributorWallets({
      ETH: {
        address: '0x1111111111111111111111111111111111111111',
        status: 'enabled',
        verifiedAt: '2026-10-05T00:00:00Z',
        testTxHash: 'fake'
      }
    });
    expect(wallets.ETH.status).toBe('unverified');
    expect(wallets.ETH.verifiedAt).toBeNull();
    expect(wallets.ETH.testTxHash).toBe('');
  });
});
