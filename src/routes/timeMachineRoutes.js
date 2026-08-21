const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const snapshotsPath = path.join(__dirname, '..', '..', 'data', 'time-machine', 'snapshots.json');

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

router.get('/', (req, res) => {
  const snapshots = sortSnapshots(loadSnapshots());
  const latest = snapshots.at(-1) || null;
  res.json({
    name: 'MyZubster Time Machine',
    mode: 'historical-state-reconstruction',
    readOnly: true,
    snapshotCount: snapshots.length,
    latest,
    endpoints: {
      snapshots: '/api/time-machine/snapshots',
      at: '/api/time-machine/at?timestamp=<ISO-8601>',
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
  const requested = req.query.timestamp;
  const target = new Date(requested);
  if (!requested || Number.isNaN(target.getTime())) {
    return res.status(400).json({ error: 'A valid ISO-8601 timestamp query parameter is required.' });
  }

  const snapshots = sortSnapshots(loadSnapshots());
  const match = snapshots.filter((snapshot) => new Date(snapshot.recordedAt) <= target).at(-1) || null;

  if (!match) {
    return res.status(404).json({ error: 'No snapshot exists at or before the requested timestamp.' });
  }

  return res.json({ requestedAt: target.toISOString(), snapshot: match, integrity: verifySnapshot(match) });
});

router.get('/snapshots/:id', (req, res) => {
  const snapshot = loadSnapshots().find((item) => item.id === req.params.id);
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found.' });
  return res.json({ snapshot, integrity: verifySnapshot(snapshot) });
});

module.exports = router;
