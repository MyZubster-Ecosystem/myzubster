const crypto = require('crypto');
const {
  EVIDENCE_EVENT_TYPES,
  EvidenceAuditEvent
} = require('../models/EvidenceAuditEvent');
const { reviewEvidenceRecord } = require('./evidenceVerticalSliceService');
const { fetchArpaeMeasuredEvidence } = require('./arpaeMeasuredObservationService');

const MIN_BASELINE_SAMPLES = 3;
const RECOMMENDATION_THRESHOLDS = Object.freeze({
  temperature_c: 5,
  relative_humidity_pct: 15
});
const OUTCOME_STATES = Object.freeze([
  'OBSERVED',
  'IMPROVED',
  'NO_EFFECT',
  'WORSENED',
  'INCONCLUSIVE'
]);

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = stableObject(value[key]);
    return acc;
  }, {});
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableObject(value)))
    .digest('hex');
}

function cleanText(value, maxLength = 200) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function makeEventId(type, evidenceId, extra = null) {
  const seed = { type, evidence_id: evidenceId, extra };
  return `ea_${sha256(seed).slice(0, 28)}`;
}

async function appendEvent(document) {
  try {
    const created = await EvidenceAuditEvent.create(document);
    return { inserted: true, event: created.toJSON() };
  } catch (error) {
    if (error && error.code === 11000) {
      const existing = await EvidenceAuditEvent.findOne({ eventId: document.eventId }).lean();
      if (existing) return { inserted: false, event: existing };
    }
    throw error;
  }
}

async function captureLatestArpaeMeasurement(options = {}) {
  const fetched = await fetchArpaeMeasuredEvidence(options);
  if (!fetched.ok || !fetched.evidence) {
    return fetched.ok ? { ok: false, error: 'ARPAE evidence missing' } : fetched;
  }

  const evidence = fetched.evidence;
  if (evidence.source_class !== 'MEASURED' || evidence.claims.measured !== true) {
    return { ok: false, error: 'Only measured evidence can enter the measured audit trail' };
  }

  const eventId = makeEventId(EVIDENCE_EVENT_TYPES.MEASUREMENT_CAPTURED, evidence.evidence_id);
  const appended = await appendEvent({
    eventId,
    eventType: EVIDENCE_EVENT_TYPES.MEASUREMENT_CAPTURED,
    evidenceId: evidence.evidence_id,
    sourceId: evidence.provenance.source_id,
    observedAt: new Date(evidence.provenance.observed_at),
    actorRef: cleanText(options.actorRef, 120) || 'system:arpae-capture',
    integrityDigest: evidence.integrity.digest_sha256,
    payload: {
      source: fetched.source,
      evidence
    }
  });

  return {
    ok: true,
    inserted: appended.inserted,
    event_id: appended.event.eventId,
    evidence,
    source: fetched.source
  };
}

function metricValues(records, key) {
  return records
    .map(record => {
      const kpi = Array.isArray(record.kpis) ? record.kpis.find(item => item.key === key) : null;
      return kpi && Number.isFinite(Number(kpi.value)) ? Number(kpi.value) : null;
    })
    .filter(value => value !== null);
}

function summarizeMetric(values) {
  if (!values.length) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return {
    count: values.length,
    average: Number((sum / values.length).toFixed(2)),
    min: Number(Math.min(...values).toFixed(2)),
    max: Number(Math.max(...values).toFixed(2))
  };
}

function buildBaseline(records, options = {}) {
  const minSamples = Number.isInteger(options.minSamples) ? options.minSamples : MIN_BASELINE_SAMPLES;
  const evidence = Array.isArray(records) ? records.filter(Boolean) : [];
  const metrics = {};

  for (const [key, threshold] of Object.entries(RECOMMENDATION_THRESHOLDS)) {
    const summary = summarizeMetric(metricValues(evidence, key));
    if (!summary) continue;
    metrics[key] = {
      ...summary,
      unit: key === 'temperature_c' ? 'C' : 'pct',
      recommendation_deviation_threshold: threshold,
      ready: summary.count >= minSamples
    };
  }

  const readyMetrics = Object.values(metrics).filter(metric => metric.ready).length;
  return {
    status: readyMetrics > 0 ? 'READY' : 'INSUFFICIENT_ACCEPTED_EVIDENCE',
    accepted_sample_count: evidence.length,
    minimum_samples: minSamples,
    ready_metric_count: readyMetrics,
    metrics
  };
}

function buildZorgaxRecommendation(currentEvidence, baseline) {
  if (!currentEvidence || !Array.isArray(currentEvidence.kpis)) {
    return { ok: false, error: 'current evidence with KPIs required' };
  }

  if (!baseline || baseline.status !== 'READY') {
    return {
      ok: true,
      recommendation: {
        state: 'NEEDS_MORE_EVIDENCE',
        classification: 'NEEDS_CLARIFICATION',
        reason_codes: ['BASELINE_NOT_READY'],
        summary: `Need at least ${baseline ? baseline.minimum_samples : MIN_BASELINE_SAMPLES} accepted baseline samples before deviation analysis.`,
        automatic_action: false,
        independently_verified: false
      }
    };
  }

  const reasons = [];
  const comparisons = [];
  for (const kpi of currentEvidence.kpis) {
    const metric = baseline.metrics[kpi.key];
    if (!metric || !metric.ready) continue;
    const value = Number(kpi.value);
    const deviation = Number((value - metric.average).toFixed(2));
    const absoluteDeviation = Math.abs(deviation);
    comparisons.push({
      key: kpi.key,
      value,
      baseline_average: metric.average,
      deviation,
      threshold: metric.recommendation_deviation_threshold,
      unit: metric.unit
    });
    if (absoluteDeviation >= metric.recommendation_deviation_threshold) {
      reasons.push(`${kpi.key.toUpperCase()}_DEVIATION`);
    }
  }

  if (!comparisons.length) {
    return {
      ok: true,
      recommendation: {
        state: 'NEEDS_MORE_EVIDENCE',
        classification: 'NEEDS_CLARIFICATION',
        reason_codes: ['NO_COMPARABLE_BASELINE_METRIC'],
        summary: 'No baseline metric has enough accepted samples for the current measurement.',
        comparisons,
        automatic_action: false,
        independently_verified: false
      }
    };
  }

  const needsReview = reasons.length > 0;
  return {
    ok: true,
    recommendation: {
      state: needsReview ? 'HUMAN_ATTENTION_SUGGESTED' : 'WITHIN_BASELINE_BOUNDS',
      classification: needsReview ? 'UPDATE_PREPARED' : 'NO_ACTION',
      reason_codes: reasons,
      summary: needsReview
        ? 'One or more accepted measurements differ materially from the accepted baseline. Human interpretation is required.'
        : 'Current accepted measurements remain within the configured baseline-deviation thresholds.',
      comparisons,
      automatic_action: false,
      independently_verified: false
    }
  };
}

async function acceptedEvidenceBefore(excludeEvidenceId = null) {
  const query = {
    eventType: EVIDENCE_EVENT_TYPES.REVIEW_RECORDED,
    'payload.reviewed_evidence.human_review.decision': 'ACCEPT'
  };
  if (excludeEvidenceId) query.evidenceId = { $ne: excludeEvidenceId };
  const events = await EvidenceAuditEvent.find(query).sort({ observedAt: 1, createdAt: 1 }).lean();
  return events.map(event => event.payload.reviewed_evidence).filter(Boolean);
}

async function persistRecommendationForAcceptedEvidence(evidenceId) {
  const existing = await EvidenceAuditEvent.findOne({
    eventType: EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED,
    evidenceId
  }).lean();
  if (existing) return { ok: true, inserted: false, event: existing };

  const reviewEvent = await EvidenceAuditEvent.findOne({
    eventType: EVIDENCE_EVENT_TYPES.REVIEW_RECORDED,
    evidenceId,
    'payload.reviewed_evidence.human_review.decision': 'ACCEPT'
  }).lean();
  if (!reviewEvent) return { ok: false, error: 'Accepted human review required before recommendation' };

  const previousAccepted = await acceptedEvidenceBefore(evidenceId);
  const baseline = buildBaseline(previousAccepted);
  const result = buildZorgaxRecommendation(reviewEvent.payload.reviewed_evidence, baseline);
  if (!result.ok) return result;

  const eventId = makeEventId(EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED, evidenceId);
  const appended = await appendEvent({
    eventId,
    eventType: EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED,
    evidenceId,
    sourceId: reviewEvent.sourceId,
    observedAt: reviewEvent.observedAt,
    actorRef: 'system:zorgax-evidence-rules-v1',
    integrityDigest: sha256({ baseline, recommendation: result.recommendation }),
    payload: {
      engine: 'zorgax-evidence-rules-v1',
      baseline,
      recommendation: result.recommendation
    }
  });

  return { ok: true, inserted: appended.inserted, event: appended.event };
}

async function recordHumanReview(evidenceId, review, options = {}) {
  const measurement = await EvidenceAuditEvent.findOne({
    eventType: EVIDENCE_EVENT_TYPES.MEASUREMENT_CAPTURED,
    evidenceId
  }).lean();
  if (!measurement) return { ok: false, error: 'Captured measurement not found' };

  const existing = await EvidenceAuditEvent.findOne({
    eventType: EVIDENCE_EVENT_TYPES.REVIEW_RECORDED,
    evidenceId
  }).lean();
  if (existing) {
    const existingDecision = existing.payload && existing.payload.reviewed_evidence && existing.payload.reviewed_evidence.human_review
      ? existing.payload.reviewed_evidence.human_review.decision
      : null;
    const requestedDecision = String(review && review.decision || '').toUpperCase();
    if (existingDecision && requestedDecision && existingDecision !== requestedDecision) {
      return { ok: false, conflict: true, error: 'Review is append-only and a different decision is already recorded' };
    }
    return { ok: true, inserted: false, event: existing };
  }

  const reviewed = reviewEvidenceRecord(measurement.payload.evidence, review, options);
  if (!reviewed.ok) return reviewed;

  const eventId = makeEventId(EVIDENCE_EVENT_TYPES.REVIEW_RECORDED, evidenceId);
  const appended = await appendEvent({
    eventId,
    eventType: EVIDENCE_EVENT_TYPES.REVIEW_RECORDED,
    evidenceId,
    sourceId: measurement.sourceId,
    observedAt: measurement.observedAt,
    actorRef: cleanText(review.reviewer_ref, 120) || 'human:reviewer',
    integrityDigest: reviewed.record.integrity.digest_sha256,
    payload: {
      reviewed_evidence: reviewed.record
    }
  });

  let recommendation = null;
  if (reviewed.record.human_review.decision === 'ACCEPT') {
    recommendation = await persistRecommendationForAcceptedEvidence(evidenceId);
  }

  return {
    ok: true,
    inserted: appended.inserted,
    event: appended.event,
    recommendation
  };
}

async function recordOutcome(evidenceId, outcome, options = {}) {
  const recommendation = await EvidenceAuditEvent.findOne({
    eventType: EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED,
    evidenceId
  }).lean();
  if (!recommendation) return { ok: false, error: 'Recommendation event not found' };

  const state = String(outcome && outcome.state || '').toUpperCase();
  if (!OUTCOME_STATES.includes(state)) {
    return { ok: false, error: `outcome.state must be one of ${OUTCOME_STATES.join(', ')}` };
  }
  const note = cleanText(outcome && outcome.note, 400);
  if (!note) return { ok: false, error: 'outcome.note required' };
  const linkedEvidenceId = cleanText(outcome && outcome.linked_evidence_id, 120);

  const eventId = makeEventId(EVIDENCE_EVENT_TYPES.OUTCOME_RECORDED, evidenceId);
  const appended = await appendEvent({
    eventId,
    eventType: EVIDENCE_EVENT_TYPES.OUTCOME_RECORDED,
    evidenceId,
    sourceId: recommendation.sourceId,
    observedAt: recommendation.observedAt,
    actorRef: cleanText(options.actorRef, 120) || 'human:operator',
    integrityDigest: sha256({ evidenceId, state, note, linkedEvidenceId }),
    payload: {
      state,
      note,
      linked_evidence_id: linkedEvidenceId,
      consequential_action_performed_by_system: false
    }
  });

  return { ok: true, inserted: appended.inserted, event: appended.event };
}

function publicMeasurementView(measurement, related = {}) {
  const evidence = measurement.payload && measurement.payload.evidence;
  const source = measurement.payload && measurement.payload.source;
  if (!evidence) return null;
  const review = related.review && related.review.payload && related.review.payload.reviewed_evidence;
  const recommendation = related.recommendation && related.recommendation.payload;
  const outcome = related.outcome && related.outcome.payload;

  return {
    evidence_id: evidence.evidence_id,
    source_class: evidence.source_class,
    truth_label: review ? review.truth_label : evidence.truth_label,
    observed_at: evidence.provenance.observed_at,
    received_at: evidence.provenance.received_at,
    source: source ? {
      provider: source.provider,
      dataset: source.dataset,
      station_name: source.station_name,
      network: source.network,
      coordinates: source.coordinates,
      license: source.license,
      provider_quality_state: source.provider_quality_state
    } : null,
    kpis: evidence.kpis,
    integrity_digest_sha256: evidence.integrity.digest_sha256,
    human_review: review ? {
      state: review.human_review.state,
      decision: review.human_review.decision,
      reviewed_at: review.human_review.reviewed_at
    } : {
      state: 'PENDING',
      decision: null,
      reviewed_at: null
    },
    zorgax_recommendation: recommendation ? recommendation.recommendation : null,
    outcome: outcome ? {
      state: outcome.state,
      linked_evidence_id: outcome.linked_evidence_id || null
    } : null
  };
}

async function publicTimeline(limit = 30) {
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const measurements = await EvidenceAuditEvent.find({
    eventType: EVIDENCE_EVENT_TYPES.MEASUREMENT_CAPTURED
  }).sort({ observedAt: -1, createdAt: -1 }).limit(boundedLimit).lean();

  const ids = measurements.map(event => event.evidenceId);
  const relatedEvents = ids.length
    ? await EvidenceAuditEvent.find({
        evidenceId: { $in: ids },
        eventType: {
          $in: [
            EVIDENCE_EVENT_TYPES.REVIEW_RECORDED,
            EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED,
            EVIDENCE_EVENT_TYPES.OUTCOME_RECORDED
          ]
        }
      }).sort({ createdAt: 1 }).lean()
    : [];

  const related = new Map();
  for (const event of relatedEvents) {
    const item = related.get(event.evidenceId) || {};
    if (event.eventType === EVIDENCE_EVENT_TYPES.REVIEW_RECORDED) item.review = event;
    if (event.eventType === EVIDENCE_EVENT_TYPES.RECOMMENDATION_PREPARED) item.recommendation = event;
    if (event.eventType === EVIDENCE_EVENT_TYPES.OUTCOME_RECORDED) item.outcome = event;
    related.set(event.evidenceId, item);
  }

  return measurements
    .map(measurement => publicMeasurementView(measurement, related.get(measurement.evidenceId) || {}))
    .filter(Boolean);
}

async function currentBaseline() {
  const accepted = await acceptedEvidenceBefore();
  return buildBaseline(accepted);
}

module.exports = {
  MIN_BASELINE_SAMPLES,
  RECOMMENDATION_THRESHOLDS,
  OUTCOME_STATES,
  buildBaseline,
  buildZorgaxRecommendation,
  publicMeasurementView,
  captureLatestArpaeMeasurement,
  recordHumanReview,
  recordOutcome,
  persistRecommendationForAcceptedEvidence,
  publicTimeline,
  currentBaseline
};
