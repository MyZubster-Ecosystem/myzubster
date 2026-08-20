const Referral = require('../models/referralModel');
const { randomUUID } = require('crypto');

exports.generateReferral = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const referralCode = randomUUID().replace(/-/g, '').substring(0, 8);
    
    const referral = new Referral({
      referralCode,
      referrerId: userId,
      status: 'pending'
    });
    await referral.save();
    
    const baseUrl = process.env.BASE_URL || 'https://myzubsterapp.onrender.com';
    res.json({
      referralCode,
      referralLink: `${baseUrl}/register?ref=${referralCode}`,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReferral = async (req, res) => {
  try {
    const referral = await Referral.findOne({ referralCode: req.params.code });
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    res.json({
      referralCode: referral.referralCode,
      status: referral.status,
      createdAt: referral.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.trackReferral = async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    if (!referralCode || !userId) {
      return res.status(400).json({ error: 'referralCode and userId are required' });
    }
    
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    if (referral.status !== 'pending') {
      return res.status(400).json({ error: 'Referral already used' });
    }
    
    referral.referredUserId = userId;
    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();
    
    res.json({ message: 'Referral tracked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.creditReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ error: 'referralCode is required' });
    }
    
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    if (referral.rewardCredited) {
      return res.status(400).json({ error: 'Reward already credited' });
    }
    
    referral.rewardCredited = true;
    referral.status = 'rewarded';
    await referral.save();
    
    res.json({ 
      message: 'Referral reward credited successfully',
      referrerReward: 5,
      referredReward: 5,
      currency: 'MYZ'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    const pendingReferrals = await Referral.countDocuments({ status: 'pending' });
    const completedReferrals = await Referral.countDocuments({ status: 'completed' });
    const rewardedReferrals = await Referral.countDocuments({ status: 'rewarded' });
    const totalMYZCredited = rewardedReferrals * 10;
    
    const topReferrers = await Referral.aggregate([
      { $match: { status: 'rewarded' } },
      { $group: { _id: '$referrerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total: totalReferrals,
      pending: pendingReferrals,
      completed: completedReferrals,
      rewarded: rewardedReferrals,
      totalMYZCredited: totalMYZCredited,
      topReferrers: topReferrers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
