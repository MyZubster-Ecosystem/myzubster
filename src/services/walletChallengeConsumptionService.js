async function consumeWalletChallenge({
  WalletChallenge,
  challengeId,
  userId,
  action,
  now = new Date(),
  session = null
}) {
  return WalletChallenge.findOneAndUpdate(
    {
      _id: challengeId,
      userId,
      action,
      usedAt: null,
      expiresAt: { $gt: now }
    },
    {
      $set: { usedAt: now }
    },
    {
      new: true,
      ...(session ? { session } : {})
    }
  );
}

function consumeMarketplaceChallenge(args) {
  return consumeWalletChallenge({
    ...args,
    action: 'MARKETPLACE_REQUEST'
  });
}

function consumeLinkWalletChallenge(args) {
  return consumeWalletChallenge({
    ...args,
    action: 'LINK_WALLET'
  });
}

module.exports = {
  consumeWalletChallenge,
  consumeMarketplaceChallenge,
  consumeLinkWalletChallenge
};
