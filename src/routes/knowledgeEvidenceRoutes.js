const express = require('express');
const {
  createKnowledgeEvidence,
  verifyKnowledgeEvidence
} = require('../services/knowledgeEvidenceService');
const { buildGithubWorkEvidence, verifyGithubWorkEvidence } = require('../services/githubWorkEvidenceService');
const { anchorMarketplaceEvidenceOnBase } = require('../services/baseMarketplaceAnchorService');
const { authenticate } = require('../middleware/auth');
const KnowledgeDraft = require('../models/KnowledgeDraft');
const { normalizeKnowledgeDraft } = require('../services/knowledgeDraftService');
const mongoose = require('mongoose');

const router = express.Router();

// Drafts are account-owned and private. A URL supplied as evidence is not a verification.
router.get('/drafts', authenticate, async (req, res) => {
  try {
    const drafts = await KnowledgeDraft.find({ ownerId: req.userId }).sort({ updatedAt: -1 }).limit(50).lean();
    return res.json({ success: true, drafts });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile leggere le bozze' }); }
});

router.post('/drafts', authenticate, async (req, res) => {
  let fields;
  try { fields = normalizeKnowledgeDraft(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    if (await KnowledgeDraft.countDocuments({ ownerId: req.userId }) >= 50) {
      return res.status(409).json({ success: false, error: 'Limite di 50 bozze raggiunto' });
    }
    const draft = await KnowledgeDraft.create({ ...fields, ownerId: req.userId });
    return res.status(201).json({ success: true, draft });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile salvare la bozza' }); }
});

router.put('/drafts/:id', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Scheda non valida' });
  let fields;
  try { fields = normalizeKnowledgeDraft(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    const draft = await KnowledgeDraft.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { $set: { ...fields, status: 'draft', reviewRequestedAt: null } },
      { new: true, runValidators: true }
    );
    return draft ? res.json({ success: true, draft }) : res.status(404).json({ success: false, error: 'Scheda non trovata' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile aggiornare la bozza' }); }
});

router.post('/drafts/:id/review-request', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Scheda non valida' });
  try {
    const draft = await KnowledgeDraft.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId, status: 'draft' },
      { $set: { status: 'review_requested', reviewRequestedAt: new Date() } },
      { new: true, runValidators: true }
    );
    return draft
      ? res.json({ success: true, draft, publication: 'NOT_PERFORMED' })
      : res.status(404).json({ success: false, error: 'Bozza non trovata o già inviata in revisione' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile richiedere la revisione' }); }
});

router.post('/', async (req, res) => {
  try {
    const anchor = req.body?.anchor === true;
    const result = await createKnowledgeEvidence(req.body || {}, { anchor });
    const code = result.anchor?.status === 'FAILED' ? 502 : 201;
    return res.status(code).json({ success: result.anchor?.status !== 'FAILED', ...result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/verify', (req, res) => {
  try {
    const { payload, evidenceHash } = req.body || {};
    if (!payload || !evidenceHash) {
      return res.status(400).json({ success: false, error: 'payload and evidenceHash are required' });
    }
    const match = verifyKnowledgeEvidence(payload, evidenceHash);
    return res.status(match ? 200 : 409).json({
      success: match,
      status: match ? 'MATCH' : 'MISMATCH',
      algorithm: 'sha256',
      evidenceHash
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/github-work', async (req, res) => {
  try {
    const result = buildGithubWorkEvidence(req.body || {});
    let anchor = { status: 'NOT_REQUESTED' };
    if (req.body?.anchor === true) {
      try {
        anchor = await anchorMarketplaceEvidenceOnBase(result.evidenceHash);
      } catch (error) {
        anchor = { status: 'FAILED', error: error.message };
      }
    }
    const code = anchor.status === 'FAILED' ? 502 : 201;
    return res.status(code).json({ success: anchor.status !== 'FAILED', ...result, anchor });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/github-work/verify', (req, res) => {
  try {
    const { payload, evidenceHash } = req.body || {};
    if (!payload || !evidenceHash) return res.status(400).json({ success:false, error:'payload and evidenceHash are required' });
    const match = verifyGithubWorkEvidence(payload, evidenceHash);
    return res.status(match ? 200 : 409).json({ success:match, status:match?'MATCH':'MISMATCH', algorithm:'sha256', evidenceHash });
  } catch (error) {
    return res.status(400).json({ success:false, error:error.message });
  }
});

module.exports = router;
