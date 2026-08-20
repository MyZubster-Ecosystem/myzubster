const Reward = require('../models/rewardModel');
const { randomUUID } = require('crypto');

function createRewardId() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

// #247: QA/testing rewards
exports.createQAReward = async (req, res) => {
  try {
    const { userId, bugDescription, severity, reproductionSteps } = req.body;
    if (!userId || !bugDescription || !reproductionSteps)
      return res.status(400).json({ error: 'userId, bugDescription, and reproductionSteps are required' });
    const sev = severity || 'normal';
    const amount = Reward.calculateQA(sev);
    const reward = new Reward({
      rewardId: createRewardId(),
      userId, rewardType: 'qa_bug', amount,
      metadata: { bugSeverity: sev }
    });
    await reward.save();
    res.status(201).json({ message: 'QA reward submitted', rewardId: reward.rewardId, amount, status: 'pending' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #248: Robot mission completion bonuses
exports.createRobotBonus = async (req, res) => {
  try {
    const { userId, jobId, orderAmount, completedWithinTime } = req.body;
    if (!userId || !jobId || orderAmount === undefined)
      return res.status(400).json({ error: 'userId, jobId, and orderAmount are required' });
    const amount = Reward.calculateRobotBonus(orderAmount, completedWithinTime);
    if (amount === 0) return res.json({ message: 'No bonus - not completed within time limit', amount: 0 });
    const reward = new Reward({
      rewardId: createRewardId(),
      userId, rewardType: 'robot_bonus', amount,
      metadata: { jobId, daysStaked: completedWithinTime ? 1 : 0 }
    });
    await reward.save();
    res.status(201).json({ message: 'Robot bonus created', rewardId: reward.rewardId, amount, jobId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #249: User referral program
exports.createReferralReward = async (req, res) => {
  try {
    const { referrerId, referredUserId, referralCode } = req.body;
    if (!referrerId || !referredUserId || !referralCode)
      return res.status(400).json({ error: 'referrerId, referredUserId, and referralCode are required' });
    const amount = Reward.calculateReferral();
    const reward1 = new Reward({
      rewardId: createRewardId(),
      userId: referrerId, rewardType: 'referral', amount,
      metadata: { referralCode, referredUserId }
    });
    const reward2 = new Reward({
      rewardId: createRewardId(),
      userId: referredUserId, rewardType: 'referral', amount,
      metadata: { referralCode, referredUserId }
    });
    await reward1.save();
    await reward2.save();
    res.status(201).json({ message: 'Referral rewards created', referrerReward: reward1.rewardId, referredReward: reward2.rewardId, amount: amount * 2 });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #250: Educational content creation rewards
exports.createEducationReward = async (req, res) => {
  try {
    const { userId, contentUrl, contentTitle, contentType } = req.body;
    if (!userId || !contentUrl)
      return res.status(400).json({ error: 'userId and contentUrl are required' });
    const reward = new Reward({
      rewardId: createRewardId(),
      userId, rewardType: 'education', amount: 0,
      metadata: { contentUrl, contentQuality: 'basic' },
      status: 'pending'
    });
    await reward.save();
    res.status(201).json({ message: 'Educational content submitted for review', rewardId: reward.rewardId, status: 'pending' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #251: Governance vote reward
exports.createGovernanceVoteReward = async (req, res) => {
  try {
    const { userId, proposalId, voteDirection } = req.body;
    if (!userId || !proposalId || !voteDirection)
      return res.status(400).json({ error: 'userId, proposalId, and voteDirection are required' });
    const amount = Reward.calculateGovernanceVote();
    const reward = new Reward({
      rewardId: createRewardId(),
      userId, rewardType: 'governance_vote', amount,
      metadata: { proposalId, voteDirection }
    });
    await reward.save();
    res.status(201).json({ message: 'Governance vote reward created', rewardId: reward.rewardId, amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #251: Governance delegation reward
exports.createGovernanceDelegationReward = async (req, res) => {
  try {
    const { userId, amountStaked, days } = req.body;
    if (!userId || !amountStaked || !days)
      return res.status(400).json({ error: 'userId, amountStaked, and days are required' });
    const amount = Reward.calculateGovernanceDelegation(amountStaked, days);
    const reward = new Reward({
      rewardId: createRewardId(),
      userId, rewardType: 'governance_delegation', amount,
      metadata: { delegationAmount: amountStaked, daysStaked: days }
    });
    await reward.save();
    res.status(201).json({ message: 'Governance delegation reward created', rewardId: reward.rewardId, amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get reward details
exports.getReward = async (req, res) => {
  try {
    const reward = await Reward.findOne({ rewardId: req.params.rewardId });
    if (!reward) return res.status(404).json({ error: 'Reward not found' });
    res.json({
      rewardId: reward.rewardId, userId: reward.userId, rewardType: reward.rewardType,
      amount: reward.amount, currency: reward.currency, status: reward.status,
      metadata: reward.metadata, reviewedBy: reward.reviewedBy,
      createdAt: reward.createdAt, paidAt: reward.paidAt
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// List rewards (dashboard)
exports.listRewards = async (req, res) => {
  try {
    const { status, type, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.rewardType = type;
    if (userId) filter.userId = userId;
    const rewards = await Reward.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({
      count: rewards.length,
      rewards: rewards.map(r => ({
        rewardId: r.rewardId, userId: r.userId, type: r.rewardType,
        amount: r.amount, status: r.status, createdAt: r.createdAt
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Approve reward (admin)
exports.approveReward = async (req, res) => {
  try {
    const { reviewedBy, quality, severity } = req.body;
    const reward = await Reward.findOne({ rewardId: req.params.rewardId });
    if (!reward) return res.status(404).json({ error: 'Reward not found' });
    if (reward.status !== 'pending') return res.status(400).json({ error: `Reward is ${reward.status}` });
    if (reward.rewardType === 'education' && quality) {
      reward.metadata.contentQuality = quality;
      reward.amount = Reward.calculateEducation(quality);
    }
    if (reward.rewardType === 'qa_bug' && severity) {
      reward.metadata.bugSeverity = severity;
      reward.amount = Reward.calculateQA(severity);
    }
    reward.status = 'approved';
    reward.reviewedBy = reviewedBy || 'admin';
    reward.paidAt = new Date();
    await reward.save();
    res.json({ message: 'Reward approved', rewardId: reward.rewardId, amount: reward.amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Stats
exports.getStats = async (req, res) => {
  try {
    const total = await Reward.countDocuments();
    const pending = await Reward.countDocuments({ status: 'pending' });
    const approved = await Reward.countDocuments({ status: 'approved' });
    const byType = await Reward.aggregate([
      { $group: { _id: '$rewardType', count: { $sum: 1 }, totalMYZ: { $sum: '$amount' } } }
    ]);
    const totalMYZ = await Reward.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ total, pending, approved, byType, totalMYZPaid: totalMYZ[0]?.total || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
