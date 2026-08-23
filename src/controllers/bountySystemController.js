const BountyConfig = require('../models/bountyConfigModel');
const axios = require('axios');
const { PAYMENT_STATES, processPayment } = require('../services/paymentLifecycle');

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://myzubsterapp.onrender.com';
const SUPPORTED_ASSETS = new Set(['MYZ', 'XMR', 'TOKEN']);

function normalizeRewardComponents(rewardComponents, rewardAmount, currency = 'MYZ') {
  if (!rewardComponents || rewardComponents.length === 0) return [{ asset: currency, amount: String(rewardAmount), status: 'ready' }];
  if (!Array.isArray(rewardComponents)) throw new Error('rewardComponents must be an array');
  const seen = new Set();
  return rewardComponents.map(component => {
    if (!component || !SUPPORTED_ASSETS.has(component.asset)) throw new Error('Unsupported reward asset');
    if (seen.has(component.asset)) throw new Error('Each reward asset may appear only once');
    seen.add(component.asset);
    if (!/^\d+(?:\.\d+)?$/.test(String(component.amount)) || Number(component.amount) <= 0) throw new Error(`Invalid ${component.asset} reward amount`);
    if (component.asset === 'TOKEN' && (!component.network || !component.contractAddress)) throw new Error('TOKEN rewards require network and contractAddress');
    return { asset: component.asset, amount: String(component.amount), status: component.asset === 'MYZ' ? 'ready' : 'pending', network: component.network, contractAddress: component.contractAddress, walletAddress: component.walletAddress, sourceReference: component.sourceReference, confirmationRequirement: component.confirmationRequirement };
  });
}

function hasPendingNonMyz(components) { return components.some(component => component.asset !== 'MYZ' && component.status !== 'paid'); }

exports.createBounty = async (req, res) => {
  try {
    const { issueNumber, repository, rewardAmount, rewardComponents } = req.body;
    if (!issueNumber || !repository) return res.status(400).json({ error: 'issueNumber and repository are required' });
    const amount = rewardAmount || 10;
    const components = normalizeRewardComponents(rewardComponents, amount, req.body.currency || 'MYZ');
    let bounty = await BountyConfig.findOne({ issueNumber });
    if (bounty) {
      bounty.rewardAmount = amount;
      bounty.repository = repository;
      bounty.rewardComponents = components;
      bounty.status = 'open';
      bounty.paymentStatus = PAYMENT_STATES.PENDING;
      await bounty.save();
    } else {
      bounty = new BountyConfig({ issueNumber, repository, rewardAmount: amount, currency: components.length === 1 ? components[0].asset : 'MULTI', rewardComponents: components, paymentAsset: process.env.MYZ_PAYMENT_ASSET || components[0].asset, paymentNetwork: process.env.MYZ_PAYMENT_NETWORK || components[0].network || 'Tari' });
      await bounty.save();
    }
    res.json({ message: 'Bounty created/updated', bounty: { issueNumber: bounty.issueNumber, repository: bounty.repository, rewardAmount: bounty.rewardAmount, currency: bounty.currency, rewardComponents: bounty.rewardComponents, status: bounty.status } });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.getBounty = async (req, res) => {
  try {
    const bounty = await BountyConfig.findOne({ issueNumber: req.params.issueNumber });
    if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
    res.json({ issueNumber: bounty.issueNumber, repository: bounty.repository, rewardAmount: bounty.rewardAmount, currency: bounty.currency, rewardComponents: bounty.rewardComponents, status: bounty.status, claimedBy: bounty.claimedBy, paymentWallet: bounty.paymentWallet, prNumber: bounty.prNumber, paidAt: bounty.paidAt });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.listBounties = async (req, res) => {
  try {
    const { status, repository } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (repository) filter.repository = repository;
    const bounties = await BountyConfig.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ count: bounties.length, bounties: bounties.map(b => ({ issueNumber: b.issueNumber, repository: b.repository, rewardAmount: b.rewardAmount, currency: b.currency, rewardComponents: b.rewardComponents, status: b.status, claimedBy: b.claimedBy, paymentWallet: b.paymentWallet, prNumber: b.prNumber })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.setPaymentWallets = async (req, res) => {
  try {
    const bounty = await BountyConfig.findOne({ issueNumber: req.params.issueNumber });
    if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
    if (['paid', 'cancelled'].includes(bounty.status)) return res.status(409).json({ error: 'Bounty is no longer accepting payment details' });
    if (!bounty.rewardComponents?.length) return res.status(409).json({ error: 'Bounty has no explicit reward components' });
    const wallets = req.body.wallets;
    if (!wallets || typeof wallets !== 'object') return res.status(400).json({ error: 'wallets object is required' });
    for (const component of bounty.rewardComponents) {
      const wallet = wallets[component.asset];
      if (!wallet || typeof wallet !== 'string' || !wallet.trim()) return res.status(400).json({ error: `Wallet required for ${component.asset}` });
      if (component.walletAddress && component.walletAddress !== wallet.trim()) return res.status(409).json({ error: `${component.asset} wallet is immutable; use cancellation/reissue` });
      component.walletAddress = wallet.trim();
    }
    bounty.status = 'claimed';
    await bounty.save();
    res.json({ message: 'Payment wallets recorded', issueNumber: bounty.issueNumber, rewardComponents: bounty.rewardComponents });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.processMerge = async (req, res) => {
  try {
    if (req.headers['x-github-event'] !== 'pull_request') return res.json({ message: 'Ignored: not a pull request event' });
    if (req.body.action !== 'closed' || !req.body.pull_request?.merged) return res.json({ message: 'Ignored: PR not merged' });
    const pr = req.body.pull_request;
    const repository = req.body.repository?.full_name;
    const contributor = pr.user?.login;
    const prBody = (pr.body || '').substring(0, 50000);
    const closingIssuesRef = prBody.match(/(?:closes|fixes|resolves)\s+#(\d+)/gi) || [];
    const issueNumbers = closingIssuesRef.map(m => parseInt(m.match(/\d+/)[0]));
    const processed = [];
    for (const issueNumber of issueNumbers) {
      const bounty = await BountyConfig.findOne({ issueNumber, repository });
      if (!bounty || bounty.status === 'paid') continue;
      bounty.status = 'completed';
      bounty.claimedBy = contributor;
      bounty.prNumber = pr.number;
      const legacyReward = !bounty.rewardComponents?.length;
      const components = legacyReward ? normalizeRewardComponents(null, bounty.rewardAmount, bounty.currency) : bounty.rewardComponents;
      if (hasPendingNonMyz(components)) {
        bounty.rewardComponents = components;
        bounty.status = 'payment_pending';
        await bounty.save();
        processed.push({ issueNumber, rewardComponents: components, status: 'payment_pending', message: 'Non-MYZ reward rail is not yet online; no payment was submitted' });
        continue;
      }
      const myz = components.find(component => component.asset === 'MYZ');
      const walletAddress = myz?.walletAddress || bounty.paymentWallet || bounty.paymentRecipient || contributor;
      bounty.paymentRecipient = walletAddress;
      bounty.paymentAsset = myz?.asset || bounty.paymentAsset || 'MYZ';
      bounty.paymentNetwork = myz?.network || bounty.paymentNetwork || 'Tari';
      try {
        const adapter = { submit: async request => { const response = await axios.post(`${GATEWAY_URL}/api/bounties/mint`, { walletAddress: request.recipient, amount: request.amount, asset: request.asset, network: request.network, issueNumber: request.issueNumber, prNumber: request.prNumber }, { timeout: 10000 }); return { txId: response.data?.txId, simulated: response.data?.simulated === true }; } };
        const verifier = null;
        const result = await processPayment({ bounty, adapter, verifier });
        bounty.paidAt = result.state === PAYMENT_STATES.CONFIRMED ? new Date() : null;
        await bounty.save();
        processed.push({ issueNumber, rewardAmount: bounty.rewardAmount, currency: bounty.currency, paymentStatus: result.state, mintTxId: bounty.paymentTxId || null, error: result.error || result.verification?.reason });
      } catch (paymentError) {
        bounty.paymentStatus = PAYMENT_STATES.FAILED;
        bounty.paymentFailureReason = paymentError.message;
        await bounty.save();
        processed.push({ issueNumber, rewardAmount: bounty.rewardAmount, paymentStatus: PAYMENT_STATES.FAILED, error: paymentError.message });
      }
    }
    res.json({ message: 'PR merge processed', contributor, prNumber: pr.number, bountiesProcessed: processed });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const totalBounties = await BountyConfig.countDocuments();
    const openBounties = await BountyConfig.countDocuments({ status: 'open' });
    const completedBounties = await BountyConfig.countDocuments({ status: 'completed' });
    const pendingBounties = await BountyConfig.countDocuments({ status: 'payment_pending' });
    const paidBounties = await BountyConfig.countDocuments({ status: 'paid' });
    const totalMYZPaid = await BountyConfig.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$rewardAmount' } } }]);
    const topContributors = await BountyConfig.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$claimedBy', count: { $sum: 1 }, totalMYZ: { $sum: '$rewardAmount' } } }, { $sort: { totalMYZ: -1 } }, { $limit: 10 }]);
    res.json({ total: totalBounties, open: openBounties, completed: completedBounties, paymentPending: pendingBounties, paid: paidBounties, totalMYZPaid: totalMYZPaid[0]?.total || 0, topContributors });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
