const { Wallet } = require('ethers');
const {
  createLinkChallenge,
  verifyLinkChallenge
} = require('../src/services/evmWalletLinkService');

describe('EVM wallet ownership linking', () => {
  test('verifies the signer for an unexpired one-time challenge', async () => {
    const wallet = Wallet.createRandom();
    const now = new Date('2026-09-25T04:00:00.000Z');
    const challenge = createLinkChallenge({
      userId:'user-123',
      address:wallet.address,
      chainId:1,
      domain:'www.myzubster.com',
      uri:'https://www.myzubster.com',
      now
    });
    const signature = await wallet.signMessage(challenge.public.message);
    const verified = verifyLinkChallenge({
      challenge:challenge.stored,
      address:wallet.address,
      message:challenge.public.message,
      signature,
      now:new Date(now.getTime() + 60_000)
    });
    expect(verified.address).toBe(wallet.address);
    expect(verified.chainId).toBe(1);
  });

  test('rejects a signature from a different wallet', async () => {
    const wallet = Wallet.createRandom();
    const other = Wallet.createRandom();
    const challenge = createLinkChallenge({
      userId:'user-123',
      address:wallet.address,
      chainId:8453
    });
    const signature = await other.signMessage(challenge.public.message);
    expect(() => verifyLinkChallenge({
      challenge:challenge.stored,
      address:wallet.address,
      message:challenge.public.message,
      signature
    })).toThrow('wallet diverso');
  });

  test('rejects expired challenges', async () => {
    const wallet = Wallet.createRandom();
    const now = new Date('2026-09-25T04:00:00.000Z');
    const challenge = createLinkChallenge({
      userId:'user-123',
      address:wallet.address,
      chainId:1,
      now,
      ttlMs:1000
    });
    const signature = await wallet.signMessage(challenge.public.message);
    expect(() => verifyLinkChallenge({
      challenge:challenge.stored,
      address:wallet.address,
      message:challenge.public.message,
      signature,
      now:new Date(now.getTime() + 2000)
    })).toThrow('scaduto');
  });

  test('challenge explicitly states that signing is not a payment', () => {
    const wallet = Wallet.createRandom();
    const challenge = createLinkChallenge({ userId:'user-123', address:wallet.address, chainId:1 });
    expect(challenge.public.message).toContain('This is not a payment and does not spend ETH');
    expect(challenge.public.message).toContain('Request ID: LINK_WALLET:user-123');
  });
});
