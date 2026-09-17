const express = require('express');
const { randomUUID } = require('crypto');
const {
  createContribution,
  reviewContribution,
  markRewardEligible,
  createReward,
} = require('../../lib/knowledge-rewards');
const KnowledgeContribution = require('../models/knowledgeContributionModel');
const Reward = require('../models/rewardModel');

const router = express.Router();

// Safe MVP preview: exercises the domain without persistence, minting or ledger writes.
router.post('/preview', (req, res) => {
  try {
    const authorId = String(req.body?.authorId || '').trim();
    const reviewerId = String(req.body?.reviewerId || '').trim();
    const title = String(req.body?.title || '').trim();
    const type = String(req.body?.type || 'pilot_knowledge').trim();
    const pilotId = String(req.body?.pilotId || '').trim() || null;
    const category = String(req.body?.category || '').trim() || null;
    const description = String(req.body?.description || '').trim();
    if (!authorId || !reviewerId || !title) return res.status(400).json({ success: false, message: 'authorId, reviewerId e title sono obbligatori' });
    const contribution = createContribution({ authorId, type, title, description, pilotId, category });
    const reviewed = reviewContribution(contribution, { reviewerId, decision: 'APPROVE', notes: 'MVP preview: approvazione esplicita del reviewer' });
    const eligible = markRewardEligible(reviewed.contribution);
    const reward = createReward(eligible, { approvedBy: reviewerId });
    return res.json({ success: true, preview: true, ledgerWritten: false, myzTransferred: false, contribution: eligible, review: reviewed.review, reward, nextStep: 'Registrare il reward nel ledger MYZ autorevole prima di marcarlo REWARDED' });
  } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
});

// Persistent claimable reward. This writes MongoDB records only; it never transfers MYZ.
router.post('/contributions', async (req, res) => {
  try {
    const authorId = String(req.body?.authorId || '').trim();
    const reviewerId = String(req.body?.reviewerId || '').trim();
    const title = String(req.body?.title || '').trim();
    const type = String(req.body?.type || 'pilot_knowledge').trim();
    const pilotId = String(req.body?.pilotId || '').trim() || null;
    const category = String(req.body?.category || '').trim() || null;
    const description = String(req.body?.description || '').trim();
    const reference = String(req.body?.reference || '').trim() || null;
    if (!authorId || !reviewerId || !title) return res.status(400).json({ success: false, message: 'authorId, reviewerId e title sono obbligatori' });
    if (authorId === reviewerId) return res.status(400).json({ success: false, message: 'Il contributore non puo approvare il proprio contributo' });

    const domainContribution = createContribution({ authorId, type, title, description, reference, pilotId, category });
    const reviewed = reviewContribution(domainContribution, { reviewerId, decision: 'APPROVE', notes: 'Persistent MVP: independent review' });
    const eligible = markRewardEligible(reviewed.contribution);
    const domainReward = createReward(eligible, { approvedBy: reviewerId });
    const rewardId = randomUUID().replace(/-/g, '').slice(0, 12);

    const contribution = await KnowledgeContribution.create({
      contributionId: eligible.id,
      authorId, type, title, description, reference, pilotId, category,
      status: 'REWARD_ELIGIBLE', reviewerId,
      reviewNotes: reviewed.review.notes,
      reputationPoints: domainReward.reputationPoints || 10,
      rewardId,
      reviewedAt: new Date(),
    });
    try {
      const reward = await Reward.create({
        rewardId, userId: authorId, rewardType: 'knowledge_contribution',
        amount: domainReward.myzAmount, currency: 'MYZ', status: 'claimable',
        reviewedBy: reviewerId,
        metadata: { contributionId: contribution.contributionId, pilotId },
      });
      return res.status(201).json({ success: true, persisted: true, ledgerWritten: false, myzTransferred: false, contributionId: contribution.contributionId, rewardId: reward.rewardId, amount: reward.amount, currency: reward.currency, status: reward.status });
    } catch (error) {
      await KnowledgeContribution.deleteOne({ _id: contribution._id });
      throw error;
    }
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
});

router.get('/kefir-kf-006', (_req, res) => res.json({
  success: true, pilotId: 'KF-006', participant: 'Nicola',
  flow: ['knowledge_contribution', 'independent_review', 'reputation', 'myz_claimable', 'ledger_finalization'],
  automaticMyzTransfer: false, status: 'READY_FOR_PREVIEW',
}));

module.exports = router;
