const express = require('express');
const {
  createContribution,
  reviewContribution,
  markRewardEligible,
  createReward,
} = require('../../lib/knowledge-rewards');

const router = express.Router();

// Safe MVP preview: exercises the Knowledge-to-MYZ domain without minting,
// transferring or writing MYZ to the authoritative ledger.
router.post('/preview', (req, res) => {
  try {
    const authorId = String(req.body?.authorId || '').trim();
    const reviewerId = String(req.body?.reviewerId || '').trim();
    const title = String(req.body?.title || '').trim();
    const type = String(req.body?.type || 'pilot_knowledge').trim();
    const pilotId = String(req.body?.pilotId || '').trim() || null;
    const category = String(req.body?.category || '').trim() || null;
    const description = String(req.body?.description || '').trim();

    if (!authorId || !reviewerId || !title) {
      return res.status(400).json({ success: false, message: 'authorId, reviewerId e title sono obbligatori' });
    }

    const contribution = createContribution({ authorId, type, title, description, pilotId, category });
    const reviewed = reviewContribution(contribution, {
      reviewerId,
      decision: 'APPROVE',
      notes: 'MVP preview: approvazione esplicita del reviewer',
    });
    const eligible = markRewardEligible(reviewed.contribution);
    const reward = createReward(eligible, { approvedBy: reviewerId });

    return res.json({
      success: true,
      preview: true,
      ledgerWritten: false,
      myzTransferred: false,
      contribution: eligible,
      review: reviewed.review,
      reward,
      nextStep: 'Registrare il reward nel ledger MYZ autorevole prima di marcarlo REWARDED',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/kefir-kf-006', (_req, res) => res.json({
  success: true,
  pilotId: 'KF-006',
  participant: 'Nicola',
  flow: ['knowledge_contribution', 'independent_review', 'reputation', 'myz_claimable', 'ledger_finalization'],
  automaticMyzTransfer: false,
  status: 'READY_FOR_PREVIEW',
}));

module.exports = router;
