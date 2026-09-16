const {
  createSignedMarketplaceOrderTransaction
} = require('../src/services/marketplaceSignedOrderTransactionService');

function fixture() {
  const session = {
    withTransaction: jest.fn(async callback => callback()),
    endSession: jest.fn().mockResolvedValue()
  };

  const mongoose = {
    startSession: jest.fn().mockResolvedValue(session)
  };

  const challenge = {
    _id: 'challenge-1',
    payloadHash: 'hash-1'
  };

  const listing = {
    _id: 'listing-1',
    ownerId: 'seller-1',
    title: 'Test listing',
    price: 10,
    currency: 'EUR',
    exchangeMode: 'SALE'
  };

  return { session, mongoose, challenge, listing };
}

describe('signed Marketplace order transaction', () => {
  test('consumes challenge and creates order in the same session', async () => {
    const { session, mongoose, challenge, listing } = fixture();

    const consumeMarketplaceChallenge = jest.fn()
      .mockResolvedValue({ _id: challenge._id });

    const order = { _id: 'order-1' };

    const MarketplaceOrder = {
      create: jest.fn().mockResolvedValue([order])
    };

    const result = await createSignedMarketplaceOrderTransaction({
      mongoose,
      WalletChallenge: {},
      MarketplaceOrder,
      consumeMarketplaceChallenge,
      challenge,
      userId: 'buyer-1',
      listing,
      quantity: 1,
      note: '',
      recovered: '0x1111111111111111111111111111111111111111',
      signature: 'signature',
      consumedAt: new Date('2026-09-16T10:00:00Z')
    });

    expect(result).toBe(order);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);

    expect(consumeMarketplaceChallenge)
      .toHaveBeenCalledWith(expect.objectContaining({ session }));

    expect(MarketplaceOrder.create)
      .toHaveBeenCalledWith(
        expect.any(Array),
        { session }
      );

    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('order creation failure rejects transaction operation', async () => {
    const { session, mongoose, challenge, listing } = fixture();

    const consumeMarketplaceChallenge = jest.fn()
      .mockResolvedValue({ _id: challenge._id });

    const MarketplaceOrder = {
      create: jest.fn().mockRejectedValue(
        new Error('simulated order creation failure')
      )
    };

    await expect(
      createSignedMarketplaceOrderTransaction({
        mongoose,
        WalletChallenge: {},
        MarketplaceOrder,
        consumeMarketplaceChallenge,
        challenge,
        userId: 'buyer-1',
        listing,
        quantity: 1,
        note: '',
        recovered: '0x1111111111111111111111111111111111111111',
        signature: 'signature',
        consumedAt: new Date('2026-09-16T10:00:00Z')
      })
    ).rejects.toThrow('simulated order creation failure');

    expect(consumeMarketplaceChallenge)
      .toHaveBeenCalledWith(expect.objectContaining({ session }));

    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('does not create order when challenge cannot be consumed', async () => {
    const { mongoose, challenge, listing } = fixture();

    const consumeMarketplaceChallenge = jest.fn()
      .mockResolvedValue(null);

    const MarketplaceOrder = {
      create: jest.fn()
    };

    await expect(
      createSignedMarketplaceOrderTransaction({
        mongoose,
        WalletChallenge: {},
        MarketplaceOrder,
        consumeMarketplaceChallenge,
        challenge,
        userId: 'buyer-1',
        listing,
        quantity: 1,
        note: '',
        recovered: '0x1111111111111111111111111111111111111111',
        signature: 'signature',
        consumedAt: new Date('2026-09-16T10:00:00Z')
      })
    ).rejects.toMatchObject({
      code: 'MARKETPLACE_CHALLENGE_NOT_CONSUMABLE'
    });

    expect(MarketplaceOrder.create).not.toHaveBeenCalled();
  });
});
