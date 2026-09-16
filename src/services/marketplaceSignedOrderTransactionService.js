async function createSignedMarketplaceOrderTransaction({
  mongoose,
  WalletChallenge,
  MarketplaceOrder,
  consumeMarketplaceChallenge,
  challenge,
  userId,
  listing,
  quantity,
  note,
  recovered,
  signature,
  consumedAt
}) {
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const consumedChallenge = await consumeMarketplaceChallenge({
        WalletChallenge,
        challengeId: challenge._id,
        userId,
        now: consumedAt,
        session
      });

      if (!consumedChallenge) {
        const error = new Error('MARKETPLACE_CHALLENGE_NOT_CONSUMABLE');
        error.code = 'MARKETPLACE_CHALLENGE_NOT_CONSUMABLE';
        throw error;
      }

      const createdOrders = await MarketplaceOrder.create([{
        listingId: listing._id,
        buyerId: userId,
        sellerId: listing.ownerId,
        quantity,
        note,
        snapshot: {
          title: listing.title,
          price: listing.price,
          currency: listing.currency,
          exchangeMode: listing.exchangeMode
        },
        walletEvidence: {
          status: 'VERIFIED',
          walletAddress: recovered,
          networkFamily: 'EVM',
          signature,
          payloadHash: challenge.payloadHash,
          challengeId: challenge._id,
          signedAt: consumedAt,
          verifiedAt: consumedAt
        }
      }], { session });

      order = createdOrders[0];
    });

    return order;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createSignedMarketplaceOrderTransaction
};
