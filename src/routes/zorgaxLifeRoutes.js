const express = require('express');
const {
  SCHEMA_VERSION,
  RULE_VERSION,
  processBatch,
  review,
  validate,
  makeReportable
} = require('../services/zorgaxLifeEvidenceService');

const router = express.Router();

function parseCsv(text) {
  const lines = String(text || '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must include header and at least one row');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) throw new Error(`CSV row ${rowIndex + 2} has invalid column count`);
    return headers.reduce((obj, key, i) => {
      const raw = values[i];
      const numeric = Number(raw);
      obj[key] = raw !== '' && Number.isFinite(numeric) ? numeric : raw;
      return obj;
    }, {});
  });
}

function ensureSynthetic(records) {
  for (const record of records) {
    const source = String(record.sourceId || '').toLowerCase();
    const asset = String(record.assetRef || '').toLowerCase();
    if (!source.includes('synthetic') && !source.includes('demo') && !asset.startsWith('synthetic://') && !asset.startsWith('demo://')) {
      const error = new Error('Phase 1 accepts synthetic/demo data only');
      error.statusCode = 400;
      throw error;
    }
  }
}

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    service: 'Zorgax LIFE Automation v1',
    phase: 1,
    data_policy: 'synthetic_only',
    schema_version: SCHEMA_VERSION,
    rule_version: RULE_VERSION,
    endpoints: {
      json_ingest: 'POST /api/zorgax/life/ingest',
      csv_ingest: 'POST /api/zorgax/life/ingest.csv',
      review: 'POST /api/zorgax/life/review',
      validate: 'POST /api/zorgax/life/validate',
      reportable: 'POST /api/zorgax/life/reportable'
    }
  });
});

router.post('/ingest', (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : req.body?.records;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ ok: false, error: 'Body must be an array or { records: [...] }' });
    }
    ensureSynthetic(records);
    const results = processBatch(records);
    res.status(201).json({ ok: true, count: results.length, schema_version: SCHEMA_VERSION, results });
  } catch (error) {
    res.status(error.statusCode || 400).json({ ok: false, error: error.message });
  }
});

router.post('/ingest.csv', express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }), (req, res) => {
  try {
    const records = parseCsv(req.body);
    ensureSynthetic(records);
    const results = processBatch(records);
    res.status(201).json({ ok: true, count: results.length, schema_version: SCHEMA_VERSION, results });
  } catch (error) {
    res.status(error.statusCode || 400).json({ ok: false, error: error.message });
  }
});

router.post('/review', (req, res) => {
  try {
    const { record, gate, actor, approved, reason } = req.body || {};
    if (!record || !gate || !actor || typeof approved !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'record, gate, actor and boolean approved are required' });
    }
    const expectedActor = gate === 'technical' ? 'life-technical-data-validator' : gate === 'scientific' ? 'life-scientific-coordinator' : null;
    if (!expectedActor || actor !== expectedActor) {
      return res.status(403).json({ ok: false, error: 'Actor is not authorized for this review gate' });
    }
    const result = review(record, { gate, actor, approved, reason });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(409).json({ ok: false, error: error.message });
  }
});

router.post('/validate', (req, res) => {
  try {
    const { record, actor = 'authorized_human', reason } = req.body || {};
    if (!record) return res.status(400).json({ ok: false, error: 'record is required' });
    if (actor !== 'authorized_human') return res.status(403).json({ ok: false, error: 'Human validation actor required' });
    const result = validate(record, { actor, reason });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(409).json({ ok: false, error: error.message });
  }
});

router.post('/reportable', (req, res) => {
  try {
    const { record } = req.body || {};
    if (!record) return res.status(400).json({ ok: false, error: 'record is required' });
    const result = makeReportable(record);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(409).json({ ok: false, error: error.message });
  }
});

module.exports = router;
module.exports.parseCsv = parseCsv;
module.exports.ensureSynthetic = ensureSynthetic;
