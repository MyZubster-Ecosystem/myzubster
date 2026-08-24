const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  DaoValidationError,
  governanceOverview,
  publicProposal,
  registry,
  validateRegistry,
  verifyBallotEnvelope,
  verifyDelegationEnvelope
} = require('../services/decentralizedDaoService');

const router = express.Router();

const signatureLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, code: 'RATE_LIMITED', error: 'Troppe verifiche di firma; riprova tra un minuto.' }
});

function publicCache(_req, res, next) {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  next();
}

function sendDaoError(res, error) {
  if (error instanceof DaoValidationError) {
    return res.status(error.statusCode).json({ ok: false, code: error.code, error: error.message });
  }
  console.error('DAO verification error:', error);
  return res.status(500).json({ ok: false, code: 'DAO_INTERNAL_ERROR', error: 'Verifica DAO non disponibile' });
}

router.get('/', publicCache, (_req, res) => {
  res.json(governanceOverview());
});

router.get('/constitution', publicCache, (_req, res) => {
  res.json({
    ok: true,
    schemaVersion: registry.schemaVersion,
    network: registry.network,
    constitution: registry.constitution
  });
});

router.get('/members', publicCache, (_req, res) => {
  res.json({
    ok: true,
    sourceOfTruth: registry.network.ledgerPath,
    reviewRequired: registry.constitution.membership.minimumIndependentReviewers,
    members: registry.members.map(({ did, displayName, kind, chambers, status, admittedAt }) => ({
      did,
      displayName,
      kind,
      chambers,
      status,
      admittedAt
    }))
  });
});

router.get('/integrity', publicCache, (_req, res) => {
  const integrity = validateRegistry(registry);
  res.status(integrity.valid ? 200 : 503).json({
    ok: integrity.valid,
    sourceOfTruth: registry.network.ledgerPath,
    integrity
  });
});

router.get('/proposals', publicCache, (req, res) => {
  const requestedState = typeof req.query.state === 'string' ? req.query.state.toUpperCase() : null;
  let proposals = registry.proposals.map((proposal) => publicProposal(proposal));
  if (requestedState) proposals = proposals.filter((proposal) => proposal.state === requestedState);
  res.json({ ok: true, count: proposals.length, proposals });
});

router.get('/proposals/:id', publicCache, (req, res) => {
  const proposal = registry.proposals.find((item) => item.id === req.params.id);
  if (!proposal) return res.status(404).json({ ok: false, code: 'PROPOSAL_NOT_FOUND', error: 'Proposta DAO non trovata' });
  return res.json({ ok: true, proposal: publicProposal(proposal) });
});

router.post('/ballots/verify', signatureLimiter, (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const receipt = verifyBallotEnvelope(req.body);
    return res.status(200).json({ ok: true, receipt });
  } catch (error) {
    return sendDaoError(res, error);
  }
});

router.post('/delegations/verify', signatureLimiter, (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const receipt = verifyDelegationEnvelope(req.body);
    return res.status(200).json({ ok: true, receipt });
  } catch (error) {
    return sendDaoError(res, error);
  }
});

module.exports = router;
