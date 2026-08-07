const BountyConfig = require('../models/bountyConfigModel');
const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://myzubsterapp.onrender.com';

// Create/set bounty for an issue (admin only)
exports.createBounty = async (req, res) => {
  try {
    const { issueNumber, repository, rewardAmount } = req.body;
    if (!issueNumber || !repository) {
      return res.status(400).json({ error: 'issueNumber and repository are required' });
    }
    const amount = rewardAmount || 10;
    
    let bounty = await BountyConfig.findOne({ issueNumber });
    if (bounty) {
      bounty.rewardAmount = amount;
      bounty.repository = repository;
      bounty.status = 'open';
      await bounty.save();
    } else {
      bounty = new BountyConfig({
        issueNumber,
        repository,
        rewardAmount: amount
      });
      await bounty.save();
    }
    
    res.json({
      message: 'Bounty created/updated',
      bounty: {
        issueNumber: bounty.issueNumber,
        repository: bounty.repository,
        rewardAmount: bounty.rewardAmount,
        currency: bounty.currency,
        status: bounty.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bounty info for an issue
exports.getBounty = async (req, res) => {
  try {
    const bounty = await BountyConfig.findOne({ issueNumber: req.params.issueNumber });
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }
    res.json({
      issueNumber: bounty.issueNumber,
      repository: bounty.repository,
      rewardAmount: bounty.rewardAmount,
      currency: bounty.currency,
      status: bounty.status,
      claimedBy: bounty.claimedBy,
      prNumber: bounty.prNumber,
      paidAt: bounty.paidAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all bounties
exports.listBounties = async (req, res) => {
  try {
    const { status, repository } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (repository) filter.repository = repository;
    
    const bounties = await BountyConfig.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({
      count: bounties.length,
      bounties: bounties.map(b => ({
        issueNumber: b.issueNumber,
        repository: b.repository,
        rewardAmount: b.rewardAmount,
        currency: b.currency,
        status: b.status,
        claimedBy: b.claimedBy,
        prNumber: b.prNumber
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process PR merge (GitHub webhook handler)
exports.processMerge = async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    if (event !== 'pull_request') {
      return res.json({ message: 'Ignored: not a pull request event' });
    }
    
    const action = req.body.action;
    if (action !== 'closed' || !req.body.pull_request?.merged) {
      return res.json({ message: 'Ignored: PR not merged' });
    }
    
    const pr = req.body.pull_request;
    const repository = req.body.repository?.full_name;
    const contributor = pr.user?.login;
    
    // Check if the PR closes an issue with a bounty
    const closingIssuesRef = pr.body?.match(/(?:closes|fixes|resolves)\s+#(\d+)/gi) || [];
    const issueNumbers = closingIssuesRef.map(m => parseInt(m.match(/\d+/)[0]));
    
    let processed = [];
    for (const issueNumber of issueNumbers) {
      const bounty = await BountyConfig.findOne({ issueNumber, repository });
      if (!bounty || bounty.status === 'paid') continue;
      
      bounty.status = 'completed';
      bounty.claimedBy = contributor;
      bounty.prNumber = pr.number;
      
      // Credit MYZ via Gateway /mint endpoint
      try {
        const mintResponse = await axios.post(`${GATEWAY_URL}/api/bounties/mint`, {
          walletAddress: contributor,
          amount: bounty.rewardAmount,
          reason: `PR #${pr.number} merged for issue #${issueNumber}`,
          issueNumber: issueNumber,
          prNumber: pr.number
        }, { timeout: 10000 });
        
        bounty.status = 'paid';
        bounty.paidAt = new Date();
        await bounty.save();
        processed.push({
          issueNumber,
          rewardAmount: bounty.rewardAmount,
          currency: bounty.currency,
          mintTxId: mintResponse.data?.txId || null
        });
      } catch (mintError) {
        bounty.status = 'completed';
        await bounty.save();
        processed.push({
          issueNumber,
          rewardAmount: bounty.rewardAmount,
          error: 'Mint failed: ' + (mintError.response?.data?.error || mintError.message)
        });
      }
    }
    
    res.json({
      message: 'PR merge processed',
      contributor,
      prNumber: pr.number,
      bountiesProcessed: processed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bounty system stats (admin)
exports.getStats = async (req, res) => {
  try {
    const totalBounties = await BountyConfig.countDocuments();
    const openBounties = await BountyConfig.countDocuments({ status: 'open' });
    const completedBounties = await BountyConfig.countDocuments({ status: 'completed' });
    const paidBounties = await BountyConfig.countDocuments({ status: 'paid' });
    
    const totalMYZPaid = await BountyConfig.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);
    
    const topContributors = await BountyConfig.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$claimedBy', count: { $sum: 1 }, totalMYZ: { $sum: '$rewardAmount' } } },
      { $sort: { totalMYZ: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total: totalBounties,
      open: openBounties,
      completed: completedBounties,
      paid: paidBounties,
      totalMYZPaid: totalMYZPaid[0]?.total || 0,
      topContributors: topContributors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
