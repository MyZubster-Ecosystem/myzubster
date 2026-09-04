const express = require('express');
const router = express.Router();

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_BUCKETS = 100000;
const buckets = new Map();
const allowedKeys = new Set(['schema', 'kind', 'release', 'runtime', 'bucket']);

function prune(now = Date.now()) {
  for (const [bucket, seenAt] of buckets) {
    if (now - seenAt > WINDOW_MS) buckets.delete(bucket);
  }
}

function validPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (Object.keys(body).some(key => !allowedKeys.has(key))) return false;
  if (body.schema !== 1 || body.kind !== 'onion_instance_heartbeat') return false;
  if (body.runtime !== 'docker') return false;
  if (typeof body.bucket !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(body.bucket)) return false;
  if (body.release != null && (typeof body.release !== 'string' || body.release.length > 64)) return false;
  return true;
}

router.post('/onion/heartbeat', (req, res) => {
  if (!validPayload(req.body)) return res.status(400).json({ ok: false, error: 'invalid_payload' });
  const now = Date.now();
  prune(now);
  if (!buckets.has(req.body.bucket) && buckets.size >= MAX_BUCKETS) {
    return res.status(429).json({ ok: false, error: 'capacity_limited' });
  }
  buckets.set(req.body.bucket, now);
  return res.status(202).json({ ok: true });
});

router.get('/onion/active', (_req, res) => {
  prune();
  return res.json({ active_onion_instances_24h: buckets.size, window_hours: 24, approximate: true });
});

module.exports = router;
