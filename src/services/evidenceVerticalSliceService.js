const crypto = require('crypto');

const SOURCE_CLASSES = Object.freeze({
  SIMULATED: 'SIMULATED',
  MEASURED: 'MEASURED'
});

const KPI_SPECS = Object.freeze({
  temperature_c: Object.freeze({ unit: 'C', min: -50, max: 80 }),
  relative_humidity_pct: Object.freeze({ unit: 'pct', min: 0, max: 100 }),
  soil_moisture_pct: Object.freeze({ unit: 'pct', min: 0, max: 100 }),
  battery_pct: Object.freeze({ unit: 'pct', min: 0, max: 100 })
});

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = stableObject(value[key]);
    return acc;
  }, {});
}

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableObject(value)))
    .digest('hex');
}

function cleanText(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function validIsoDate(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
}

function normalizeKpis(telemetry) {
  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) {
    return { ok: false, error: 'telemetry object required' };
  }

  const kpis = [];
  for (const [key, spec] of Object.entries(KPI_SPECS)) {
    if (telemetry[key] === undefined || telemetry[key] === null) continue;
    const value = Number(telemetry[key]);
    if (!Number.isFinite(value)) return { ok: false, error: `${key} must be numeric` };
    if (value < spec.min || value > spec.max) {
      return { ok: false, error: `${key} outside supported range ${spec.min}..${spec.max}` };
    }
    kpis.push({ key, value, unit: spec.unit });
  }

  if (kpis.length === 0) {
    return { ok: false, error: `at least one supported KPI required: ${Object.keys(KPI_SPECS).join(', ')}` };
  }

  return { ok: true, kpis };
}

function validateObservation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'JSON observation required' };
  }

  const sourceClass = String(input.source_class || '').toUpperCase();
  if (!Object.values(SOURCE_CLASSES).includes(sourceClass)) {
    return { ok: false, error: 'source_class must be SIMULATED or MEASURED' };
  }

  const sourceId = cleanText(input.provenance && input.provenance.source_id, 120);
  if (!sourceId) return { ok: false, error: 'provenance.source_id required' };

  const observedAt = input.provenance && input.provenance.observed_at;
  if (!validIsoDate(observedAt)) return { ok: false, error: 'provenance.observed_at must be a valid ISO date' };

  const kpis = normalizeKpis(input.telemetry);
  if (!kpis.ok) return kpis;

  if (sourceClass === SOURCE_CLASSES.MEASURED) {
    const authorization = input.authorization;
    if (!authorization || authorization.confirmed !== true) {
      return { ok: false, error: 'MEASURED evidence requires authorization.confirmed=true' };
    }
    const scope = cleanText(authorization.scope, 200);
    const reference = cleanText(authorization.reference, 160);
    if (!scope || !reference) {
      return { ok: false, error: 'MEASURED evidence requires authorization.scope and authorization.reference' };
    }
  }

  return {
    ok: true,
    sourceClass,
    sourceId,
    observedAt: new Date(observedAt).toISOString(),
    kpis: kpis.kpis,
    authorization: sourceClass === SOURCE_CLASSES.MEASURED
      ? {
          confirmed: true,
          scope: cleanText(input.authorization.scope, 200),
          reference: cleanText(input.authorization.reference, 160)
        }
      : {
          confirmed: false,
          scope: 'simulation-only',
          reference: 'not-applicable'
        },
    context: cleanText(input.context, 240)
  };
}

function integrityPayload(record) {
  return {
    schema_version: record.schema_version,
    evidence_id: record.evidence_id,
    source_class: record.source_class,
    truth_label: record.truth_label,
    provenance: record.provenance,
    kpis: record.kpis,
    authorization: record.authorization
  };
}

function createEvidenceRecord(input, options = {}) {
  const validation = validateObservation(input);
  if (!validation.ok) return validation;

  const receivedAt = options.now instanceof Date ? options.now : new Date();
  const truthLabel = validation.sourceClass === SOURCE_CLASSES.MEASURED
    ? 'MEASURED_PENDING_HUMAN_REVIEW'
    : 'SIMULATED_PENDING_HUMAN_REVIEW';

  const identitySeed = {
    source_class: validation.sourceClass,
    source_id: validation.sourceId,
    observed_at: validation.observedAt,
    kpis: validation.kpis
  };

  const record = {
    schema_version: 'myzubster-evidence-v1',
    evidence_id: `ev_${digest(identitySeed).slice(0, 24)}`,
    evidence_kind: 'environmental-observation',
    source_class: validation.sourceClass,
    truth_label: truthLabel,
    context: validation.context,
    provenance: {
      source_id: validation.sourceId,
      observed_at: validation.observedAt,
      received_at: receivedAt.toISOString(),
      chain: ['source', 'myzubster-evidence-v1', 'zorgax-classification', 'human-review-gate']
    },
    authorization: validation.authorization,
    kpis: validation.kpis,
    zorgax: {
      classification: 'UPDATE_PREPARED',
      action: 'PREPARE_FOR_HUMAN_REVIEW',
      automatic_verification: false,
      automatic_publication: false
    },
    human_review: {
      state: 'PENDING',
      decision: null,
      reviewer_ref: null,
      reviewed_at: null
    },
    claims: {
      measured: validation.sourceClass === SOURCE_CLASSES.MEASURED,
      simulated: validation.sourceClass === SOURCE_CLASSES.SIMULATED,
      human_reviewed: false,
      verified: false,
      physically_actuated: false,
      financially_settled: false
    }
  };

  record.integrity = {
    algorithm: 'sha256',
    digest_sha256: digest(integrityPayload(record))
  };

  return { ok: true, record };
}

function verifyEvidenceIntegrity(record) {
  if (!record || typeof record !== 'object') return false;
  if (!record.integrity || typeof record.integrity.digest_sha256 !== 'string') return false;
  return digest(integrityPayload(record)) === record.integrity.digest_sha256;
}

function reviewEvidenceRecord(record, review, options = {}) {
  if (!verifyEvidenceIntegrity(record)) {
    return { ok: false, error: 'Evidence integrity check failed' };
  }
  if (!review || typeof review !== 'object') return { ok: false, error: 'review object required' };

  const decision = String(review.decision || '').toUpperCase();
  if (!['ACCEPT', 'REJECT'].includes(decision)) {
    return { ok: false, error: 'review.decision must be ACCEPT or REJECT' };
  }
  const reviewerRef = cleanText(review.reviewer_ref, 120);
  if (!reviewerRef) return { ok: false, error: 'review.reviewer_ref required' };

  const reviewedAt = options.now instanceof Date ? options.now : new Date();
  const reviewed = JSON.parse(JSON.stringify(record));
  reviewed.human_review = {
    state: decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
    decision,
    reviewer_ref: reviewerRef,
    reviewed_at: reviewedAt.toISOString(),
    note: cleanText(review.note, 240)
  };
  reviewed.claims.human_reviewed = true;
  reviewed.claims.verified = false;
  reviewed.truth_label = decision === 'REJECT'
    ? `${record.source_class}_REJECTED`
    : `${record.source_class}_HUMAN_REVIEWED`;
  reviewed.zorgax.action = decision === 'REJECT'
    ? 'STOP_AND_CORRECT'
    : 'READY_FOR_BOUNDED_PUBLICATION_REVIEW';

  reviewed.integrity = {
    algorithm: 'sha256',
    digest_sha256: digest(integrityPayload(reviewed))
  };

  return { ok: true, record: reviewed };
}

module.exports = {
  SOURCE_CLASSES,
  KPI_SPECS,
  normalizeKpis,
  validateObservation,
  createEvidenceRecord,
  verifyEvidenceIntegrity,
  reviewEvidenceRecord
};
