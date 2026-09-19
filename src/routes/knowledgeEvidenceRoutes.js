const express = require('express');
const {
  createKnowledgeEvidence,
  verifyKnowledgeEvidence
} = require('../services/knowledgeEvidenceService');
const { buildGithubWorkEvidence, verifyGithubWorkEvidence } = require('../services/githubWorkEvidenceService');
const { anchorMarketplaceEvidenceOnBase } = require('../services/baseMarketplaceAnchorService');

const router = express.Router();

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
