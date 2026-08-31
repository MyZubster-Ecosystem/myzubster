const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  ROBOTS,
  createFleetPulse,
  validateExternalSimulationTelemetry
} = require('../services/robotSimulationService');

const router = express.Router();
const publicPulseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

function simulationAuthorized(req) {
  const auth = req.headers.authorization;
  const secrets = [process.env.ROBOT_SIMULATION_TOKEN, process.env.CRON_SECRET].filter(Boolean);
  return secrets.some(secret => auth === `Bearer ${secret}`);
}

function emitPulse(source) {
  const pulse = createFleetPulse({ source });
  console.log('[robot-sim] fleet pulse', JSON.stringify({
    state: pulse.state,
    source,
    generated_at: pulse.generated_at,
    robots: pulse.robots.map(robot => robot.robot_id)
  }));
  return pulse;
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'MyZubster Robot Simulation Runtime',
    capability: 'robot-simulation-runtime-v1',
    state: 'SIMULATION_ACTIVE',
    runtime_model: 'request-driven/serverless',
    robots: ROBOTS.map(robot => ({ id: robot.id, name: robot.name })),
    actuators_enabled: false,
    physical_hardware_verified: false,
    autonomous_settlement_enabled: false
  });
});

router.get('/status', publicPulseLimiter, (_req, res) => {
  res.json(emitPulse('public-status'));
});

router.get('/simulation/pulse', publicPulseLimiter, (_req, res) => {
  res.json(emitPulse('public-safe-probe'));
});

router.get('/simulation/cron', (req, res) => {
  if (!simulationAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Simulation cron not authorized' });
  }
  return res.json(emitPulse('vercel-cron'));
});

router.post('/simulation/telemetry', (req, res) => {
  if (!simulationAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Simulation telemetry not authorized' });
  }
  const validation = validateExternalSimulationTelemetry(req.body);
  if (!validation.ok) return res.status(400).json({ ok: false, error: validation.error });

  const receivedAt = new Date().toISOString();
  console.log('[robot-sim] external telemetry', JSON.stringify({
    robot_id: validation.robot.id,
    received_at: receivedAt,
    fields: Object.keys(validation.telemetry).slice(0, 40)
  }));

  return res.status(202).json({
    ok: true,
    state: 'SIMULATION_ACTIVE',
    robot_id: validation.robot.id,
    received_at: receivedAt,
    physical_actuation_performed: false,
    autonomous_settlement_performed: false
  });
});

module.exports = router;
