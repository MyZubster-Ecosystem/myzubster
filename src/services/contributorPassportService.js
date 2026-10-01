const Reward = require('../models/rewardModel');

async function getContributorPassport(userId) {

  const rewards = await Reward
    .find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    contributorId: userId,

    summary: {
      rewards: rewards.length,
      totalAmount: rewards.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      ),
      completedRewards: rewards.filter(
        r => r.status === 'completed'
      ).length
    },

    knowledge: [],

    rewards: rewards.map(r => ({
      id: r._id,
      amount: r.amount,
      reason: r.reason,
      source: r.source,
      transaction: r.txId,
      status: r.status,
      createdAt: r.createdAt
    }))
  };
}

module.exports = {
  getContributorPassport
};
