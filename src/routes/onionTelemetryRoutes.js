const express = require('express');
const rateLimit = require('express-rate-limit');
const OnionTelemetryHeartbeat = require('../models/OnionTelemetryHeartbeat');

const router = express.Router();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const allowedKeys = new Set(['schema', 'kind', 'release', 'runtime', 'bucket']);

// Limit abuse at the HTTP edge. No IP or User-Agent is written to the telemetry model.
const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

function validPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (Object.keys(body).some(key => !allowedKeys.has(key))) return false;
  if (body.schema !== 1 || body.kind !== 'onion_instance_heartbeat') return false;
  if (body.runtime !== 'docker') return false;
  if (typeof body.bucket !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(body.bucket)) return false;
  if (body.release != null && (typeof body.release !== 'string' || body.release.length > 64)) return false;
  return true;
}

router.post('/onion/heartbeat', heartbeatLimiter, async (req, res) => {
  if (!validPayload(req.body)) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);
  try {
    await OnionTelemetryHeartbeat.updateOne(
      { bucket: req.body.bucket },
      {
        $set: {
          release: req.body.release || null,
          runtime: req.body.runtime,
          lastSeenAt: now,
          expiresAt
        }
      },
      { upsert: true, runValidators: true }
    );
    return res.status(202).json({ ok: true });
  } catch (error) {
    return res.status(503).json({ ok: false, error: 'telemetry_unavailable' });
  }
});

router.get('/onion/active', async (_req, res) => {
  const since = new Date(Date.now() - WINDOW_MS);
  try {
    const active = await OnionTelemetryHeartbeat.countDocuments({ lastSeenAt: { $gte: since } });
    return res.json({
      active_onion_instances_24h: active,
      window_hours: 24,
      approximate: true,
      scope: 'opt_in_instances'
    });
  } catch (error) {
    return res.status(503).json({ ok: false, error: 'telemetry_unavailable' });
  }
});

module.exports = router;
module.exports.validPayload = validPayload;
