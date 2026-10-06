const crypto = require('crypto');

const SCHEMA_VERSION = 'life-evidence/1.0';
const RULE_VERSION = 'zorgax-life-phase1/1.0';
const REQUIRED = ['sourceId', 'observationTimestamp', 'variable', 'rawValue', 'unit', 'assetRef', 'accessClass'];

const UNIT_RULES = {
  mg_l: { aliases: ['mg/l', 'mg_l'], factor: 1, unit: 'mg/L' },
  ug_l: { aliases: ['ug/l', 'µg/l', 'μg/l'], factor: 0.001, unit: 'mg/L' },
  celsius: { aliases: ['c', '°c', 'celsius'], factor: 1, unit: '°C' },
  ph: { aliases: ['ph'], factor: 1, unit: 'pH' }
};

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out; }, {});
  }
  return value;
}

function fingerprint(record) {
  const material = {
    sourceId: record.sourceId,
    observationTimestamp: record.observationTimestamp,
    variable: record.variable,
    rawValue: record.rawValue,
    unit: record.unit,
    assetRef: record.assetRef
  };
  return crypto.createHash('sha256').update(JSON.stringify(stable(material))).digest('hex');
}

function audit(state, actor, reason, now = new Date()) {
  return { state, actor, timestamp: now.toISOString(), ruleVersion: RULE_VERSION, reason };
}

function normalizeUnit(rawValue, unit) {
  const token = String(unit || '').trim().toLowerCase();
  const rule = Object.values(UNIT_RULES).find(item => item.aliases.includes(token));
  const numeric = Number(rawValue);
  if (!rule || !Number.isFinite(numeric)) return { normalizedValue: rawValue, unit, normalized: false };
  return { normalizedValue: numeric * rule.factor, unit: rule.unit, normalized: true };
}

function anomalyFor(record) {
  const value = Number(record.normalizedValue);
  if (!Number.isFinite(value)) return null;
  const variable = String(record.variable || '').toLowerCase();
  if (variable === 'ph' && (value < 0 || value > 14)) return 'pH_OUT_OF_RANGE';
  if ((record.unit === 'mg/L') && value < 0) return 'NEGATIVE_CONCENTRATION';
  if (record.unit === '°C' && (value < -20 || value > 80)) return 'TEMPERATURE_OUT_OF_DEMO_RANGE';
  return null;
}

function processRecord(input, { seen = new Set(), now = new Date() } = {}) {
  const record = { ...input };
  const auditEvents = [audit('RECEIVED', 'zorgax', 'synthetic/demo record ingested', now)];
  const missing = REQUIRED.filter(field => record[field] === undefined || record[field] === null || record[field] === '');
  if (missing.length) {
    auditEvents.push(audit('MISSING_CONTEXT', 'zorgax', `missing required fields: ${missing.join(', ')}`, now));
    return { state: 'MISSING_CONTEXT', missingFields: missing, auditEvents, reportable: false };
  }

  auditEvents.push(audit('SCHEMA_CHECKED', 'zorgax', `schema ${SCHEMA_VERSION} accepted`, now));
  const fp = fingerprint(record);
  if (seen.has(fp)) {
    auditEvents.push(audit('SUPERSEDED', 'zorgax', 'duplicate deterministic fingerprint', now));
    return { state: 'SUPERSEDED', fingerprint: fp, duplicate: true, auditEvents, reportable: false };
  }
  seen.add(fp);

  const normalized = normalizeUnit(record.rawValue, record.unit);
  Object.assign(record, normalized);
  auditEvents.push(audit('NORMALIZED', 'zorgax', normalized.normalized ? 'approved unit rule applied' : 'value retained; no conversion rule required', now));

  record.provenance = {
    sourceId: record.sourceId,
    assetRef: record.assetRef,
    fingerprint: fp,
    schemaVersion: SCHEMA_VERSION,
    synthetic: true
  };
  auditEvents.push(audit('PROVENANCE_ATTACHED', 'zorgax', 'deterministic provenance attached', now));

  const anomaly = anomalyFor(record);
  if (anomaly) {
    record.qualityFlags = [anomaly];
    auditEvents.push(audit('ANOMALY_REVIEW', 'zorgax', anomaly, now));
    return { ...record, recordId: `life-${fp.slice(0, 16)}`, state: 'ANOMALY_REVIEW', auditEvents, reportable: false };
  }

  record.qualityFlags = [];
  record.recordId = `life-${fp.slice(0, 16)}`;
  record.ingestionTimestamp = now.toISOString();
  record.kpiRefs = [];
  record.technicalReviewStatus = 'PENDING';
  record.scientificReviewStatus = 'PENDING';
  auditEvents.push(audit('DRAFT_EVIDENCE', 'zorgax', 'draft evidence created', now));
  return { ...record, state: 'DRAFT_EVIDENCE', auditEvents, reportable: false };
}

function review(record, { gate, actor, approved, reason = 'review completed', now = new Date() }) {
  const out = { ...record, auditEvents: [...(record.auditEvents || [])] };
  if (gate === 'technical') {
    if (out.state !== 'DRAFT_EVIDENCE') throw new Error('Technical review requires DRAFT_EVIDENCE');
    out.technicalReviewStatus = approved ? 'APPROVED' : 'REJECTED';
    out.state = approved ? 'TECHNICAL_REVIEW' : 'ANOMALY_REVIEW';
  } else if (gate === 'scientific') {
    if (out.state !== 'TECHNICAL_REVIEW' || out.technicalReviewStatus !== 'APPROVED') throw new Error('Scientific review requires approved TECHNICAL_REVIEW');
    out.scientificReviewStatus = approved ? 'APPROVED' : 'REJECTED';
    out.state = approved ? 'SCIENTIFIC_REVIEW' : 'ANOMALY_REVIEW';
  } else throw new Error('Unknown review gate');
  out.auditEvents.push(audit(out.state, actor, reason, now));
  return out;
}

function validate(record, { actor = 'authorized_human', reason = 'human validation completed', now = new Date() } = {}) {
  if (record.state !== 'SCIENTIFIC_REVIEW' || record.scientificReviewStatus !== 'APPROVED') throw new Error('Validation requires approved scientific review');
  const out = { ...record, state: 'VALIDATED', auditEvents: [...record.auditEvents, audit('VALIDATED', actor, reason, now)] };
  return out;
}

function makeReportable(record, { now = new Date() } = {}) {
  if (record.state !== 'VALIDATED') throw new Error('Only VALIDATED records can become REPORTABLE');
  if (String(record.accessClass).toLowerCase() === 'restricted') throw new Error('Restricted records cannot become REPORTABLE');
  return { ...record, state: 'REPORTABLE', reportable: true, auditEvents: [...record.auditEvents, audit('REPORTABLE', 'zorgax', 'validated non-restricted evidence exported', now)] };
}

function processBatch(records) {
  const seen = new Set();
  return records.map(record => processRecord(record, { seen }));
}

module.exports = { SCHEMA_VERSION, RULE_VERSION, fingerprint, normalizeUnit, processRecord, processBatch, review, validate, makeReportable };
