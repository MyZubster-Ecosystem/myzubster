async function consumeMarketplaceChallenge({
  WalletChallenge,
  challengeId,
  userId,
  now = new Date()
}) {
  return WalletChallenge.findOneAndUpdate(
    {
      _id: challengeId,
      userId,
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
}

module.exports = {
  consumeMarketplaceChallenge
};
