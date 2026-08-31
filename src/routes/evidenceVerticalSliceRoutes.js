const express = require('express');
const { getRobot, createSimulationSnapshot } = require('../services/robotSimulationService');
const {
  createEvidenceRecord,
  reviewEvidenceRecord
} = require('../services/evidenceVerticalSliceService');

const router = express.Router();

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

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'MyZubster Evidence Vertical Slice',
    schema_version: 'myzubster-evidence-v1',
    capability: 'authorized-input-to-human-review-v1',
    source_classes: ['SIMULATED', 'MEASURED'],
    measured_requires_explicit_authorization: true,
    human_review_required: true,
    automatic_verification: false,
    automatic_publication: false
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
