const express = require('express');
const { randomUUID } = require('crypto');
const {
  createContribution,
  reviewContribution,
  markRewardEligible,
  createReward,
} = require('../../lib/knowledge-rewards');
const { authenticate, isAdmin } = require('../middleware/auth');
const KnowledgeContribution = require('../models/knowledgeContributionModel');
const Reward = require('../models/rewardModel');

const router = express.Router();

// User-created knowledge records. Creation never creates a reward or writes MYZ.
router.post('/submissions', authenticate, async (req, res) => {
  try {
    const authorId = String(req.userId || '').trim();
    const title = String(req.body?.title || '').trim().slice(0, 180);
    const type = String(req.body?.type || 'community_knowledge').trim().slice(0, 80);
    const category = String(req.body?.category || '').trim().slice(0, 80) || null;
    const description = String(req.body?.description || '').trim().slice(0, 4000);
    const reference = String(req.body?.reference || '').trim().slice(0, 500) || null;
    if (!authorId || title.length < 3) return res.status(400).json({ success:false, message:'Inserisci un titolo valido per la conoscenza' });

    const domainContribution = createContribution({ authorId, type, title, description, reference, category });
    const contribution = await KnowledgeContribution.create({
      contributionId: domainContribution.id,
      authorId,
      type,
      title,
      description,
      reference,
      category,
      status:'PENDING_REVIEW'
    });

    return res.status(201).json({
      success:true,
      persisted:true,
      contribution:{
        id:String(contribution._id),
        contributionId:contribution.contributionId,
        title:contribution.title,
        category:contribution.category,
        description:contribution.description,
        reference:contribution.reference,
        status:contribution.status,
        createdAt:contribution.createdAt
      },
      rewardCreated:false,
      ledgerWritten:false,
      myzTransferred:false
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 400;
    return res.status(status).json({ success:false, message:error.message || 'Conoscenza non salvata' });
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const items = await KnowledgeContribution.find({ authorId:String(req.userId) })
      .sort({ createdAt:-1 })
      .limit(100)
      .lean();
    return res.json({ success:true, items });
  } catch (_error) {
    return res.status(500).json({ success:false, message:'Conoscenze non disponibili' });
  }
});

router.patch('/submissions/:id/review', authenticate, isAdmin, async (req, res) => {
  try {
    const decision = String(req.body?.decision || '').trim().toUpperCase();
    if (!['APPROVE','REJECT'].includes(decision)) return res.status(400).json({ success:false, message:'Decisione non valida' });
    const contribution = await KnowledgeContribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ success:false, message:'Conoscenza non trovata' });
    if (contribution.status !== 'PENDING_REVIEW') return res.status(409).json({ success:false, message:'Conoscenza già revisionata' });
    contribution.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    contribution.reviewerId = String(req.userId);
    contribution.reviewNotes = String(req.body?.notes || '').trim().slice(0, 1000) || null;
    contribution.reviewedAt = new Date();
    await contribution.save();
    return res.json({
      success:true,
      contribution:{
        id:String(contribution._id),
        contributionId:contribution.contributionId,
        status:contribution.status,
        reviewerId:contribution.reviewerId,
        reviewNotes:contribution.reviewNotes,
        reviewedAt:contribution.reviewedAt
      },
      rewardCreated:false,
      ledgerWritten:false,
      myzTransferred:false
    });
  } catch (error) {
    return res.status(400).json({ success:false, message:error.message || 'Revisione non salvata' });
  }
});

// Safe, non-persistent preview. It never mints, transfers, or writes MYZ to a ledger.
router.post('/preview', authenticate, (req, res) => {
  try {
    const authorId = String(req.userId || '').trim();
    const reviewerId = String(req.body?.reviewerId || '').trim();
    const title = String(req.body?.title || '').trim();
    const type = String(req.body?.type || 'pilot_knowledge').trim();
    const pilotId = String(req.body?.pilotId || '').trim() || null;
    const category = String(req.body?.category || '').trim() || null;
    const description = String(req.body?.description || '').trim();
    if (!authorId || !reviewerId || !title) return res.status(400).json({ success: false, message: 'utente autenticato, reviewerId e title sono obbligatori' });
    if (authorId === reviewerId) return res.status(400).json({ success: false, message: 'Il contributore non puo approvare il proprio contributo' });
    const contribution = createContribution({ authorId, type, title, description, pilotId, category });
    const reviewed = reviewContribution(contribution, { reviewerId, decision: 'APPROVE', notes: 'MVP preview: approvazione indipendente' });
    const eligible = markRewardEligible(reviewed.contribution);
    const reward = createReward(eligible, { approvedBy: reviewerId });
    return res.json({ success: true, preview: true, ledgerWritten: false, myzTransferred: false, contribution: eligible, review: reviewed.review, reward, nextStep: 'Registrare il reward nel ledger MYZ autorevole prima di marcarlo REWARDED' });
  } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
});

// Persistent claimable reward. Admin review is required. This writes MongoDB only.
router.post('/contributions', authenticate, isAdmin, async (req, res) => {
  try {
    const authorId = String(req.body?.authorId || '').trim();
    const reviewerId = String(req.userId || '').trim();
    const title = String(req.body?.title || '').trim();
    const type = String(req.body?.type || 'pilot_knowledge').trim();
    const pilotId = String(req.body?.pilotId || '').trim() || null;
    const category = String(req.body?.category || '').trim() || null;
    const description = String(req.body?.description || '').trim();
    const reference = String(req.body?.reference || '').trim() || null;
    if (!authorId || !reviewerId || !title) return res.status(400).json({ success: false, message: 'authorId, reviewer autenticato e title sono obbligatori' });
    if (authorId === reviewerId) return res.status(400).json({ success: false, message: 'Il contributore non puo approvare il proprio contributo' });

    const domainContribution = createContribution({ authorId, type, title, description, reference, pilotId, category });
    const reviewed = reviewContribution(domainContribution, { reviewerId, decision: 'APPROVE', notes: 'Persistent MVP: authenticated independent admin review' });
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

// Finalize local state only after an authoritative external ledger operation succeeded.
// This endpoint does not mint or transfer MYZ.
router.post('/rewards/:rewardId/finalize', authenticate, isAdmin, async (req, res) => {
  try {
    const rewardId = String(req.params.rewardId || '').trim();
    const ledgerReference = String(req.body?.ledgerReference || '').trim();
    if (!rewardId || !ledgerReference) return res.status(400).json({ success: false, message: 'rewardId e ledgerReference sono obbligatori' });

    const reward = await Reward.findOne({ rewardId, rewardType: 'knowledge_contribution' });
    if (!reward) return res.status(404).json({ success: false, message: 'Knowledge reward non trovato' });

    const contributionId = reward.metadata?.contributionId;
    const contribution = contributionId ? await KnowledgeContribution.findOne({ contributionId }) : null;
    if (!contribution) return res.status(409).json({ success: false, message: 'Contributo collegato non trovato: finalizzazione bloccata' });

    if (reward.status === 'paid' || contribution.status === 'REWARDED') {
      const existingReference = reward.metadata?.ledgerReference || contribution.ledgerReference;
      if (existingReference !== ledgerReference) return res.status(409).json({ success: false, message: 'Reward gia finalizzato con un ledgerReference differente' });
      return res.json({ success: true, idempotent: true, ledgerWritten: true, myzTransferred: false, rewardId, contributionId, ledgerReference, status: 'REWARDED' });
    }

    if (reward.status !== 'claimable' || contribution.status !== 'REWARD_ELIGIBLE') {
      return res.status(409).json({ success: false, message: 'Reward o contributo non sono nello stato finalizzabile' });
    }

    reward.status = 'paid';
    reward.metadata = reward.metadata || {};
    reward.metadata.ledgerReference = ledgerReference;
    reward.paidAt = new Date();
    contribution.status = 'REWARDED';
    contribution.ledgerReference = ledgerReference;
    contribution.rewardedAt = reward.paidAt;

    await contribution.save();
    try {
      await reward.save();
    } catch (error) {
      contribution.status = 'REWARD_ELIGIBLE';
      contribution.ledgerReference = null;
      contribution.rewardedAt = null;
      await contribution.save();
      throw error;
    }

    return res.json({ success: true, idempotent: false, ledgerWritten: true, myzTransferred: false, rewardId, contributionId, ledgerReference, status: 'REWARDED' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/kefir-kf-006', (_req, res) => res.json({
  success: true, pilotId: 'KF-006', participant: 'Nicola',
  flow: ['knowledge_contribution', 'independent_review', 'reputation', 'myz_claimable', 'ledger_finalization'],
  automaticMyzTransfer: false, status: 'READY_FOR_PREVIEW',
}));

module.exports = router;
