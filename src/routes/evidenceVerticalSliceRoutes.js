const express = require('express');
const { getRobot, createSimulationSnapshot } = require('../services/robotSimulationService');
const {
  createEvidenceRecord,
  reviewEvidenceRecord
} = require('../services/evidenceVerticalSliceService');
const {
  ARPAE_DATASET_PAGE,
  ARPAE_LICENSE,
  fetchArpaeMeasuredEvidence
} = require('../services/arpaeMeasuredObservationService');
const {
  captureLatestArpaeMeasurement,
  recordHumanReview,
  recordOutcome,
  publicTimeline,
  currentBaseline
} = require('../services/evidenceAuditTrailService');

const router = express.Router();
const ARPAE_CACHE_TTL_MS = 15 * 60 * 1000;
let arpaeCache = null;

function bearerMatches(req, secrets) {
  const auth = req.headers.authorization;
  return secrets.filter(Boolean).some(secret => auth === `Bearer ${secret}`);
}

function ingestAuthorized(req) {
  return bearerMatches(req, [
    process.env.EVIDENCE_INGEST_TOKEN,
    process.env.ROBOT_SIMULATION_TOKEN,
    process.env.CRON_SECRET
  ]);
}

function reviewAuthorized(req) {
  return bearerMatches(req, [process.env.EVIDENCE_REVIEW_TOKEN]);
}

function cronAuthorized(req) {
  return bearerMatches(req, [process.env.CRON_SECRET]);
}

function simulationDemo(now = new Date()) {
  const robot = getRobot('EVA-IONI');
  const snapshot = createSimulationSnapshot(robot, { now, source: 'evidence-vertical-slice-demo' });
  return createEvidenceRecord({
    source_class: 'SIMULATED',
    context: 'Public demonstration of the MyZubster evidence pipeline. No physical measurement is claimed.',
    provenance: {
      source_id: `${snapshot.robot_id}:simulation-runtime-v1`,
      observed_at: snapshot.heartbeat_at
    },
    telemetry: snapshot.telemetry
  }, { now });
}

async function arpaeLatest() {
  const now = Date.now();
  if (arpaeCache && now - arpaeCache.fetchedAt < ARPAE_CACHE_TTL_MS) return arpaeCache.payload;
  const payload = await fetchArpaeMeasuredEvidence();
  arpaeCache = { fetchedAt: now, payload };
  return payload;
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'MyZubster Evidence Vertical Slice',
    schema_version: 'myzubster-evidence-v1',
    capability: 'measured-input-to-auditable-outcome-v1',
    source_classes: ['SIMULATED', 'MEASURED'],
    measured_requires_explicit_authorization: true,
    connected_measured_sources: [
      {
        provider: 'ARPAE Emilia-Romagna',
        dataset: 'Meteo - dati osservati',
        license: ARPAE_LICENSE,
        dataset_url: ARPAE_DATASET_PAGE,
        truth_boundary: 'MEASURED but provisional; not independently verified/final'
      }
    ],
    audit_cycle: {
      append_only_events: true,
      measurement_capture: true,
      persistent_human_review: true,
      accepted_baseline: true,
      zorgax_advisory_recommendation: true,
      persistent_outcome_log: true,
      minimum_baseline_samples: 3
    },
    human_review_required: true,
    automatic_verification: false,
    automatic_publication: false,
    automatic_actuation: false
  });
});

router.get('/demo', (_req, res) => {
  const result = simulationDemo();
  if (!result.ok) return res.status(500).json(result);
  return res.json({
    ok: true,
    demo: true,
    note: 'Synthetic telemetry is truth-labeled SIMULATED and cannot become a measured claim.',
    evidence: result.record
  });
});

router.get('/arpae/latest', async (_req, res) => {
  res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
  try {
    const result = await arpaeLatest();
    if (!result.ok) return res.status(502).json(result);
    return res.json({
      ok: true,
      measured_source: true,
      persisted: false,
      publication_performed: false,
      independently_verified: false,
      note: 'ARPAE near-real-time observations are real measured open data, but remain provisional and may change after later validation.',
      source: result.source,
      evidence: result.evidence
    });
  } catch (error) {
    console.error('[evidence-v1] ARPAE source unavailable', error.message);
    return res.status(503).json({
      ok: false,
      source: 'ARPAE Emilia-Romagna / Meteo - dati osservati',
      error: 'Measured source temporarily unavailable',
      measured_claim_created: false,
      fallback_to_simulation: false
    });
  }
});

router.get('/arpae/history', async (req, res) => {
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    const records = await publicTimeline(req.query.limit);
    return res.json({
      ok: true,
      append_only: true,
      public_projection: true,
      count: records.length,
      records
    });
  } catch (error) {
    console.error('[evidence-v1] history unavailable', error.message);
    return res.status(503).json({ ok: false, error: 'Evidence history temporarily unavailable' });
  }
});

router.get('/arpae/baseline', async (_req, res) => {
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    const baseline = await currentBaseline();
    return res.json({
      ok: true,
      source: 'accepted human-reviewed measured evidence only',
      baseline
    });
  } catch (error) {
    console.error('[evidence-v1] baseline unavailable', error.message);
    return res.status(503).json({ ok: false, error: 'Evidence baseline temporarily unavailable' });
  }
});

router.post('/arpae/capture', async (req, res) => {
  if (!ingestAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Evidence capture not authorized' });
  }
  try {
    const result = await captureLatestArpaeMeasurement({
      actorRef: req.body && req.body.actor_ref ? req.body.actor_ref : 'system:authorized-capture'
    });
    if (!result.ok) return res.status(502).json(result);
    return res.status(result.inserted ? 201 : 200).json({
      ...result,
      persisted: true,
      append_only: true,
      independently_verified: false
    });
  } catch (error) {
    console.error('[evidence-v1] capture failed', error.message);
    return res.status(503).json({ ok: false, error: 'Evidence capture temporarily unavailable' });
  }
});

router.get('/arpae/capture/cron', async (req, res) => {
  if (!cronAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Evidence capture cron not authorized' });
  }
  try {
    const result = await captureLatestArpaeMeasurement({ actorRef: 'system:vercel-cron' });
    if (!result.ok) return res.status(502).json(result);
    return res.json({
      ok: true,
      inserted: result.inserted,
      evidence_id: result.evidence.evidence_id,
      observed_at: result.evidence.provenance.observed_at,
      persisted: true,
      append_only: true
    });
  } catch (error) {
    console.error('[evidence-v1] capture cron failed', error.message);
    return res.status(503).json({ ok: false, error: 'Evidence capture cron temporarily unavailable' });
  }
});

router.post('/audit/review', async (req, res) => {
  if (!reviewAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Persistent evidence review not authorized' });
  }
  const evidenceId = req.body && req.body.evidence_id;
  const review = req.body && req.body.review;
  if (!evidenceId) return res.status(400).json({ ok: false, error: 'evidence_id required' });
  try {
    const result = await recordHumanReview(evidenceId, review || {});
    if (!result.ok) return res.status(result.conflict ? 409 : 400).json(result);
    return res.status(result.inserted ? 201 : 200).json({
      ok: true,
      inserted: result.inserted,
      append_only: true,
      independently_verified: false,
      event_id: result.event.eventId,
      reviewed_evidence: result.event.payload.reviewed_evidence,
      recommendation: result.recommendation && result.recommendation.ok
        ? result.recommendation.event.payload.recommendation
        : null
    });
  } catch (error) {
    console.error('[evidence-v1] persistent review failed', error.message);
    return res.status(503).json({ ok: false, error: 'Persistent review temporarily unavailable' });
  }
});

router.post('/audit/outcome', async (req, res) => {
  if (!reviewAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Evidence outcome log not authorized' });
  }
  const evidenceId = req.body && req.body.evidence_id;
  const outcome = req.body && req.body.outcome;
  if (!evidenceId) return res.status(400).json({ ok: false, error: 'evidence_id required' });
  try {
    const result = await recordOutcome(evidenceId, outcome || {}, {
      actorRef: req.body && req.body.actor_ref
    });
    if (!result.ok) return res.status(400).json(result);
    return res.status(result.inserted ? 201 : 200).json({
      ok: true,
      inserted: result.inserted,
      append_only: true,
      event_id: result.event.eventId,
      outcome: {
        state: result.event.payload.state,
        linked_evidence_id: result.event.payload.linked_evidence_id || null,
        consequential_action_performed_by_system: false
      }
    });
  } catch (error) {
    console.error('[evidence-v1] outcome log failed', error.message);
    return res.status(503).json({ ok: false, error: 'Outcome log temporarily unavailable' });
  }
});

router.post('/ingest', (req, res) => {
  if (!ingestAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Evidence ingest not authorized' });
  }

  const result = createEvidenceRecord(req.body);
  if (!result.ok) return res.status(400).json(result);

  console.log('[evidence-v1] prepared evidence', JSON.stringify({
    evidence_id: result.record.evidence_id,
    source_class: result.record.source_class,
    truth_label: result.record.truth_label,
    kpis: result.record.kpis.map(kpi => kpi.key)
  }));

  return res.status(202).json({
    ok: true,
    persisted: false,
    publication_performed: false,
    evidence: result.record
  });
});

router.post('/review', (req, res) => {
  if (!reviewAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Evidence review not authorized' });
  }

  const result = reviewEvidenceRecord(req.body && req.body.evidence, req.body && req.body.review);
  if (!result.ok) return res.status(400).json(result);

  console.log('[evidence-v1] human review', JSON.stringify({
    evidence_id: result.record.evidence_id,
    source_class: result.record.source_class,
    decision: result.record.human_review.decision,
    truth_label: result.record.truth_label
  }));

  return res.json({
    ok: true,
    persisted: false,
    publication_performed: false,
    independently_verified: false,
    evidence: result.record
  });
});

module.exports = router;
