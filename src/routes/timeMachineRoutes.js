const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const snapshotsPath = path.join(__dirname, '..', '..', 'data', 'time-machine', 'snapshots.json');
const SUPPORTED_DOMAINS = ['plants', 'sensors', 'maps', 'robots'];

function loadSnapshots() {
  try {
    const raw = fs.readFileSync(snapshotsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function canonicalPayload(snapshot) {
  const copy = JSON.parse(JSON.stringify(snapshot));
  if (copy.integrity) delete copy.integrity.sha256;
  return JSON.stringify(copy);
}

function verifySnapshot(snapshot) {
  const expected = snapshot?.integrity?.sha256;
  if (!expected) return { verified: false, reason: 'missing_sha256' };
  const actual = crypto.createHash('sha256').update(canonicalPayload(snapshot)).digest('hex');
  return {
    verified: actual === expected,
    expected,
    actual
  };
}

function sortSnapshots(snapshots) {
  return [...snapshots].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
}

function snapshotAt(timestamp) {
  const target = new Date(timestamp);
  if (!timestamp || Number.isNaN(target.getTime())) return { error: 'invalid_timestamp' };
  const match = sortSnapshots(loadSnapshots())
    .filter((snapshot) => new Date(snapshot.recordedAt) <= target)
    .at(-1) || null;
  return { target, match };
}

function domainState(snapshot, domain) {
  if (!SUPPORTED_DOMAINS.includes(domain)) return undefined;
  return snapshot?.state?.domains?.[domain] ?? null;
}

router.get('/', (req, res) => {
  const snapshots = sortSnapshots(loadSnapshots());
  const latest = snapshots.at(-1) || null;
  res.json({
    name: 'MyZubster Time Machine',
    mode: 'historical-state-reconstruction',
    readOnly: true,
    supportedDomains: SUPPORTED_DOMAINS,
    snapshotCount: snapshots.length,
    latest,
    endpoints: {
      snapshots: '/api/time-machine/snapshots',
      at: '/api/time-machine/at?timestamp=<ISO-8601>',
      domainAt: '/api/time-machine/domains/:domain/at?timestamp=<ISO-8601>',
      compare: '/api/time-machine/compare?from=<ISO-8601>&to=<ISO-8601>&domain=<optional-domain>',
      snapshot: '/api/time-machine/snapshots/:id'
    },
    note: 'Snapshots are evidence records, not claims that every referenced component was production-ready.'
  });
});

router.get('/snapshots', (req, res) => {
  const snapshots = sortSnapshots(loadSnapshots());
  res.json({ count: snapshots.length, snapshots });
});

router.get('/at', (req, res) => {
  const result = snapshotAt(req.query.timestamp);
  if (result.error) {
    return res.status(400).json({ error: 'A valid ISO-8601 timestamp query parameter is required.' });
  }
  if (!result.match) {
    return res.status(404).json({ error: 'No snapshot exists at or before the requested timestamp.' });
  }
  return res.json({ requestedAt: result.target.toISOString(), snapshot: result.match, integrity: verifySnapshot(result.match) });
});

router.get('/domains/:domain/at', (req, res) => {
  const { domain } = req.params;
  if (!SUPPORTED_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'Unsupported domain.', supportedDomains: SUPPORTED_DOMAINS });
  }
  const result = snapshotAt(req.query.timestamp);
  if (result.error) {
    return res.status(400).json({ error: 'A valid ISO-8601 timestamp query parameter is required.' });
  }
  if (!result.match) {
    return res.status(404).json({ error: 'No snapshot exists at or before the requested timestamp.' });
  }
  return res.json({
    requestedAt: result.target.toISOString(),
    domain,
    snapshotId: result.match.id,
    recordedAt: result.match.recordedAt,
    classification: result.match.classification,
    provenance: result.match.provenance,
    state: domainState(result.match, domain),
    integrity: verifySnapshot(result.match)
  });
});

router.get('/compare', (req, res) => {
  const { from, to, domain } = req.query;
  if (domain && !SUPPORTED_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'Unsupported domain.', supportedDomains: SUPPORTED_DOMAINS });
  }

  const fromResult = snapshotAt(from);
  const toResult = snapshotAt(to);
  if (fromResult.error || toResult.error) {
    return res.status(400).json({ error: 'Valid ISO-8601 from and to query parameters are required.' });
  }
  if (!fromResult.match || !toResult.match) {
    return res.status(404).json({ error: 'A snapshot is missing for one or both comparison timestamps.' });
  }

  const before = domain ? domainState(fromResult.match, domain) : fromResult.match.state;
  const after = domain ? domainState(toResult.match, domain) : toResult.match.state;

  return res.json({
    domain: domain || 'all',
    from: {
      requestedAt: fromResult.target.toISOString(),
      snapshotId: fromResult.match.id,
      recordedAt: fromResult.match.recordedAt,
      state: before,
      integrity: verifySnapshot(fromResult.match)
    },
    to: {
      requestedAt: toResult.target.toISOString(),
      snapshotId: toResult.match.id,
      recordedAt: toResult.match.recordedAt,
      state: after,
      integrity: verifySnapshot(toResult.match)
    },
    changed: JSON.stringify(before) !== JSON.stringify(after),
    note: 'changed compares recorded snapshot state only; it does not infer unrecorded real-world events.'
  });
});

router.get('/snapshots/:id', (req, res) => {
  const snapshot = loadSnapshots().find((item) => item.id === req.params.id);
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found.' });
  return res.json({ snapshot, integrity: verifySnapshot(snapshot) });
});

module.exports = router;
