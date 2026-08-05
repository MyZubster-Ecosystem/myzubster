const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Treasury = require('../models/Treasury');
const Delegation = require('../models/Delegation');
const { STATUSES, CATEGORIES } = require('../models/Proposal');

// ─── Helpers ───────────────────────────────────────────

async function getTotalTokens() {
  // Placeholder: in a real system, query token contract / ledger
  return parseInt(process.env.DAO_TOTAL_TOKENS || '10000', 10);
}

async function getUserTokens(userId) {
  // Placeholder: in a real system, query token balance
  return parseInt(process.env.DAO_DEFAULT_TOKENS || '100', 10);
}

async function recomputeTally(proposal) {
  const votes = await Vote.find({ proposalId: proposal._id });
  proposal.votesFor = votes.filter(v => v.choice === 'for').reduce((s, v) => s + v.weight, 0);
  proposal.votesAgainst = votes.filter(v => v.choice === 'against').reduce((s, v) => s + v.weight, 0);
  proposal.votesAbstain = votes.filter(v => v.choice === 'abstain').reduce((s, v) => s + v.weight, 0);
  proposal.totalVotingPower = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  return proposal;
}

// ═══════════════ PROPOSALS ═══════════════

// POST /api/dao/proposals — create
router.post('/proposals', async (req, res) => {
  try {
    const { title, description, category, proposerId, quorum, approvalThreshold, votingEndsAt, executionPayload } = req.body;
    if (!title || !description || !proposerId) {
      return res.status(400).json({ success: false, message: 'title, description, proposerId required' });
    }
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category. Allowed: ' + CATEGORIES.join(', ') });
    }

    const proposal = await Proposal.create({
      title, description, category: category || 'other', proposerId,
      quorum: quorum || 50, approvalThreshold: approvalThreshold || 50,
      votingEndsAt: votingEndsAt || null, executionPayload: executionPayload || null,
    });

    return res.status(201).json({ success: true, data: proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/proposals — list (filters: status, proposerId, category)
router.get('/proposals', async (req, res) => {
  try {
    const { status, proposerId, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (proposerId) filter.proposerId = proposerId;
    if (category) filter.category = category;

    const proposals = await Proposal.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: proposals, count: proposals.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/proposals/:id
router.get('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    const votes = await Vote.find({ proposalId: proposal._id });
    return res.json({ success: true, data: proposal, votes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/dao/proposals/:id — update (only draft proposals)
router.put('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Can only edit draft proposals' });
    }

    const { title, description, category, quorum, approvalThreshold, votingEndsAt, executionPayload } = req.body;
    if (title) proposal.title = title;
    if (description) proposal.description = description;
    if (category) proposal.category = category;
    if (quorum) proposal.quorum = quorum;
    if (approvalThreshold) proposal.approvalThreshold = approvalThreshold;
    if (votingEndsAt) proposal.votingEndsAt = votingEndsAt;
    if (executionPayload !== undefined) proposal.executionPayload = executionPayload;

    await proposal.save();
    return res.json({ success: true, data: proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/proposals/:id/publish — activate for voting
router.post('/proposals/:id/publish', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft proposals can be published' });
    }
    proposal.status = 'active';
    proposal.votingStartsAt = new Date();
    if (!proposal.votingEndsAt) {
      const end = new Date();
      end.setDate(end.getDate() + 7); // default 7 days
      proposal.votingEndsAt = end;
    }
    await proposal.save();
    return res.json({ success: true, data: proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/proposals/:id/cancel
router.post('/proposals/:id/cancel', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (!['draft', 'active'].includes(proposal.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this proposal' });
    }
    proposal.status = 'cancelled';
    await proposal.save();
    return res.json({ success: true, data: proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/proposals/:id/comment
router.post('/proposals/:id/comment', async (req, res) => {
  try {
    const { authorId, text } = req.body;
    if (!authorId || !text) return res.status(400).json({ success: false, message: 'authorId and text required' });
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    proposal.comments.push({ authorId, text });
    await proposal.save();
    return res.json({ success: true, data: proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════ VOTING ═══════════════

// POST /api/dao/vote — cast vote
router.post('/vote', async (req, res) => {
  try {
    const { proposalId, voterId, choice, reason } = req.body;
    if (!proposalId || !voterId || !choice) {
      return res.status(400).json({ success: false, message: 'proposalId, voterId, choice required' });
    }
    if (!['for', 'against', 'abstain'].includes(choice)) {
      return res.status(400).json({ success: false, message: 'choice must be for/against/abstain' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Voting not open for this proposal' });
    }
    if (proposal.votingEndsAt && new Date() > proposal.votingEndsAt) {
      return res.status(400).json({ success: false, message: 'Voting period has ended' });
    }

    // Check existing vote
    const existing = await Vote.findOne({ proposalId, voterId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already voted on this proposal' });
    }

    // Get voter weight (user tokens + any delegations)
    const baseWeight = await getUserTokens(voterId);
    const delegations = await Delegation.find({
      $or: [{ delegatee: voterId }, { delegateeId: voterId }]
    });

    let delegatedWeight = 0;
    for (const d of delegations) {
      const delegatorId = d.delegator || d.delegatorId;
      if (delegatorId) {
        delegatedWeight += await getUserTokens(delegatorId);
      }
    }

    const totalWeight = baseWeight + delegatedWeight;

    const vote = await Vote.create({
      proposalId,
      voterId,
      choice,
      weight: totalWeight,
      reason: reason || ''
    });

    // Recompute tally & update proposal status if necessary
    await recomputeTally(proposal);
    await proposal.save();

    return res.status(201).json({ success: true, data: vote });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/treasury — get current treasury status
router.get('/treasury', async (req, res) => {
  try {
    const treasury = await Treasury.findOne() || { balance: 10000, transactions: [] };
    return res.json({ success: true, data: treasury });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/delegate — delegate voting power
router.post('/delegate', async (req, res) => {
  try {
    const { delegatorId, delegateeId } = req.body;
    if (!delegatorId || !delegateeId) {
      return res.status(400).json({ success: false, message: 'delegatorId and delegateeId required' });
    }
    if (delegatorId === delegateeId) {
      return res.status(400).json({ success: false, message: 'Cannot delegate to yourself' });
    }

    const delegation = await Delegation.findOneAndUpdate(
      { delegatorId },
      { delegateeId, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: delegation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;lse, message: 'Already voted. Use PUT to change vote.' });
    }

    // Check delegation — if someone delegated their vote, check if delegate already voted
    const delegation = await Delegation.findOne({ delegatorId: voterId, isActive: true });
    if (delegation) {
      const delegateVote = await Vote.findOne({ proposalId, voterId: delegation.delegateId });
      if (delegateVote) {
        return res.status(409).json({ success: false, message: 'Your delegate already voted on your behalf' });
      }
    }

    const weight = await getUserTokens(voterId);
    const vote = await Vote.create({ proposalId, voterId, choice, weight, reason: reason || '' });

    await recomputeTally(proposal);
    await proposal.save();

    return res.status(201).json({ success: true, data: vote, proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/dao/vote — change vote
router.put('/vote', async (req, res) => {
  try {
    const { proposalId, voterId, choice, reason } = req.body;
    if (!proposalId || !voterId || !choice) {
      return res.status(400).json({ success: false, message: 'proposalId, voterId, choice required' });
    }
    if (!['for', 'against', 'abstain'].includes(choice)) {
      return res.status(400).json({ success: false, message: 'choice must be for/against/abstain' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal || proposal.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Voting not open' });
    }

    const vote = await Vote.findOne({ proposalId, voterId });
    if (!vote) {
      return res.status(404).json({ success: false, message: 'No existing vote to update' });
    }

    vote.choice = choice;
    vote.reason = reason || vote.reason;
    await vote.save();

    await recomputeTally(proposal);
    await proposal.save();

    return res.json({ success: true, data: vote, proposal });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/proposals/:id/finalize — tally and decide
router.post('/proposals/:id/finalize', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active proposals can be finalized' });
    }

    await recomputeTally(proposal);

    const totalTokens = await getTotalTokens();
    const participation = (proposal.totalVotingPower / totalTokens) * 100;
    const approval = proposal.totalVotingPower > 0
      ? (proposal.votesFor / proposal.totalVotingPower) * 100
      : 0;

    if (participation >= proposal.quorum && approval >= proposal.approvalThreshold) {
      proposal.status = 'passed';
    } else {
      proposal.status = 'rejected';
    }

    await proposal.save();
    return res.json({ success: true, data: proposal, participation, approval });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/proposals/:id/execute — auto-execute passed proposal
router.post('/proposals/:id/execute', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'passed') {
      return res.status(400).json({ success: false, message: 'Only passed proposals can be executed' });
    }
    if (!proposal.executionPayload) {
      return res.status(400).json({ success: false, message: 'No execution payload defined' });
    }

    // Execute treasury action if applicable
    const payload = proposal.executionPayload;
    if (payload.action === 'treasury_transfer' && payload.treasuryId && payload.amount && payload.to) {
      const treasury = await Treasury.findById(payload.treasuryId);
      if (treasury && treasury.balance >= payload.amount) {
        treasury.balance -= payload.amount;
        treasury.transactions.push({
          type: 'withdrawal', amount: payload.amount,
          from: treasury.name, to: payload.to,
          proposalId: proposal._id, note: 'DAO proposal execution: ' + proposal.title,
        });
        await treasury.save();
      } else {
        return res.status(400).json({ success: false, message: 'Insufficient treasury funds' });
      }
    }

    proposal.status = 'executed';
    proposal.executedAt = new Date();
    await proposal.save();

    return res.json({ success: true, data: proposal, message: 'Proposal executed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════ TREASURY ═══════════════

// POST /api/dao/treasury — create treasury
router.post('/treasury', async (req, res) => {
  try {
    const { name, ownerId, currency } = req.body;
    if (!ownerId) return res.status(400).json({ success: false, message: 'ownerId required' });
    const treasury = await Treasury.create({ name: name || 'Main Treasury', ownerId, currency: currency || 'XMR' });
    return res.status(201).json({ success: true, data: treasury });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/treasury — list treasuries
router.get('/treasury', async (req, res) => {
  try {
    const { ownerId } = req.query;
    const filter = ownerId ? { ownerId } : {};
    const treasuries = await Treasury.find(filter);
    return res.json({ success: true, data: treasuries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/treasury/:id/deposit
router.post('/treasury/:id/deposit', async (req, res) => {
  try {
    const { amount, from, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Positive amount required' });
    const treasury = await Treasury.findById(req.params.id);
    if (!treasury) return res.status(404).json({ success: false, message: 'Treasury not found' });
    treasury.balance += amount;
    treasury.transactions.push({ type: 'deposit', amount, from: from || '', note: note || '' });
    await treasury.save();
    return res.json({ success: true, data: treasury });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/dao/treasury/:id/withdraw
router.post('/treasury/:id/withdraw', async (req, res) => {
  try {
    const { amount, to, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Positive amount required' });
    const treasury = await Treasury.findById(req.params.id);
    if (!treasury) return res.status(404).json({ success: false, message: 'Treasury not found' });
    if (treasury.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient funds' });
    treasury.balance -= amount;
    treasury.transactions.push({ type: 'withdrawal', amount, to: to || '', note: note || '' });
    await treasury.save();
    return res.json({ success: true, data: treasury });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/treasury/:id/transactions
router.get('/treasury/:id/transactions', async (req, res) => {
  try {
    const treasury = await Treasury.findById(req.params.id);
    if (!treasury) return res.status(404).json({ success: false, message: 'Treasury not found' });
    return res.json({ success: true, data: treasury.transactions, balance: treasury.balance });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════ DELEGATION ═══════════════

// POST /api/dao/delegate — create delegation
router.post('/delegate', async (req, res) => {
  try {
    const { delegatorId, delegateId, tokenWeight, scope, expiresAt } = req.body;
    if (!delegatorId || !delegateId) {
      return res.status(400).json({ success: false, message: 'delegatorId and delegateId required' });
    }
    if (delegatorId === delegateId) {
      return res.status(400).json({ success: false, message: 'Cannot delegate to yourself' });
    }

    // Check existing active delegation for same scope
    const existing = await Delegation.findOne({ delegatorId, scope: scope || 'all', isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Active delegation already exists for this scope. Revoke first.' });
    }

    const delegation = await Delegation.create({
      delegatorId, delegateId,
      tokenWeight: tokenWeight || (await getUserTokens(delegatorId)),
      scope: scope || 'all',
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({ success: true, data: delegation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dao/delegate — list delegations
router.get('/delegate', async (req, res) => {
  try {
    const { delegatorId, delegateId } = req.query;
    const filter = { isActive: true };
    if (delegatorId) filter.delegatorId = delegatorId;
    if (delegateId) filter.delegateId = delegateId;
    const delegations = await Delegation.find(filter);
    return res.json({ success: true, data: delegations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/dao/delegate/:id — revoke
router.delete('/delegate/:id', async (req, res) => {
  try {
    const delegation = await Delegation.findById(req.params.id);
    if (!delegation) return res.status(404).json({ success: false, message: 'Delegation not found' });
    delegation.isActive = false;
    await delegation.save();
    return res.json({ success: true, message: 'Delegation revoked' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════ META ═══════════════

router.get('/meta/status', (_req, res) => {
  res.json({ success: true, data: { statuses: STATUSES, categories: CATEGORIES } });
});

module.exports = router;
