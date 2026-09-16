const {
  consumeMarketplaceChallenge
} = require('../src/services/walletChallengeConsumptionService');

describe('Marketplace wallet challenge consumption', () => {
  test('uses an atomic conditional findOneAndUpdate', async () => {
    const consumed = {
      _id: 'challenge-1',
      usedAt: new Date()
    };

    const WalletChallenge = {
      findOneAndUpdate: jest.fn().mockResolvedValue(consumed)
    };

    const now = new Date('2026-09-16T09:00:00Z');

    const result = await consumeMarketplaceChallenge({
      WalletChallenge,
      challengeId: 'challenge-1',
      userId: 'user-1',
      now
    });

    expect(result).toBe(consumed);

    expect(WalletChallenge.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'challenge-1',
        userId: 'user-1',
        action: 'MARKETPLACE_REQUEST',
        usedAt: null,
        expiresAt: { $gt: now }
      },
      {
        $set: { usedAt: now }
      },
      {
        new: true
      }
    );
  });

  test('second consumption attempt fails when challenge is already used', async () => {
    const WalletChallenge = {
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValueOnce({ _id: 'challenge-1' })
        .mockResolvedValueOnce(null)
    };

    const args = {
      WalletChallenge,
      challengeId: 'challenge-1',
      userId: 'user-1',
      now: new Date('2026-09-16T09:00:00Z')
    };

    const first = await consumeMarketplaceChallenge(args);
    const second = await consumeMarketplaceChallenge(args);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(WalletChallenge.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('Wallet link challenge consumption', () => {
  test('LINK_WALLET challenge can be consumed only once', async () => {
    const {
      consumeLinkWalletChallenge
    } = require('../src/services/walletChallengeConsumptionService');

    const WalletChallenge = {
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValueOnce({ _id: 'link-challenge-1' })
        .mockResolvedValueOnce(null)
    };

    const args = {
      WalletChallenge,
      challengeId: 'link-challenge-1',
      userId: 'user-1',
      now: new Date('2026-09-16T09:30:00Z')
    };

    const first = await consumeLinkWalletChallenge(args);
    const replay = await consumeLinkWalletChallenge(args);

    expect(first).not.toBeNull();
    expect(replay).toBeNull();
    expect(WalletChallenge.findOneAndUpdate).toHaveBeenCalledTimes(2);

    expect(WalletChallenge.findOneAndUpdate.mock.calls[0][0])
      .toMatchObject({
        _id: 'link-challenge-1',
        userId: 'user-1',
        action: 'LINK_WALLET',
        usedAt: null
      });
  });
});
