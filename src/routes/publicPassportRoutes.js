const express = require('express');

// SECURITY: Public knowledge passports must be opt-in. The knowledge graph
// contains contributor-linked evidence and financial metadata, and no
// authoritative, persisted publication-consent gate is wired here yet.
// Fail closed until that gate, field-level consent, and revoke tests exist.
// Do NOT replace this with an environment flag or an in-memory allowlist.
const router = express.Router();

router.get('/:contributorId', (_req, res) => {
  res.set('Cache-Control', 'no-store, private');
  return res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

module.exports = router;
