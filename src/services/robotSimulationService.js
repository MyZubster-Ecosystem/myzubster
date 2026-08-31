const ROBOTS = Object.freeze([
  Object.freeze({ id: 'EVA-IONI', name: 'EVA IONI', repository: 'MyZubster-Ecosystem/EVA-IONI' }),
  Object.freeze({ id: 'MYZUBSTER-ROBOT', name: 'MyZubster Robot', repository: 'MyZubster-Ecosystem/MyZubster-Robot' })
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function deterministicTelemetry(robotId, now = new Date()) {
  const t = now.getTime() / 60000;
  const phase = robotId === 'EVA-IONI' ? 0 : Math.PI / 3;
  return {
    synthetic: true,
    temperature_c: Number((22 + Math.sin(t / 7 + phase) * 2.2).toFixed(2)),
    relative_humidity_pct: Number(clamp(58 + Math.cos(t / 11 + phase) * 8, 0, 100).toFixed(2)),
    soil_moisture_pct: Number(clamp(47 + Math.sin(t / 13 + phase) * 9, 0, 100).toFixed(2)),
    battery_pct: Number(clamp(82 + Math.cos(t / 17 + phase) * 5, 0, 100).toFixed(2)),
    motion_enabled: false,
    irrigation_enabled: false
  };
}

function getRobot(robotId) {
  return ROBOTS.find(robot => robot.id === String(robotId || '').toUpperCase()) || null;
}

function createSimulationSnapshot(robot, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  return {
    robot_id: robot.id,
    name: robot.name,
    repository: robot.repository,
    operational_state: 'SIMULATION_ACTIVE',
    runtime_model: 'request-driven/serverless',
    heartbeat_kind: 'synthetic',
    heartbeat_at: now.toISOString(),
    source: options.source || 'simulation-runtime-v1',
    telemetry: deterministicTelemetry(robot.id, now),
    safety: {
      physical_hardware_verified: false,
      actuators_enabled: false,
      autonomous_settlement_enabled: false,
      private_keys_on_robot: false,
      human_authority_required_for_physical_actions: true
    }
  };
}

function createFleetPulse(options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  return {
    ok: true,
    capability: 'robot-simulation-runtime-v1',
    state: 'SIMULATION_ACTIVE',
    generated_at: now.toISOString(),
    robots: ROBOTS.map(robot => createSimulationSnapshot(robot, { ...options, now }))
  };
}

function containsPhysicalCommand(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const forbidden = ['command', 'actuate', 'motor', 'move', 'velocity', 'speed', 'pump', 'valve', 'irrigate', 'relay', 'gpio'];
  const keys = Object.keys(payload).map(key => key.toLowerCase());
  return forbidden.some(term => keys.some(key => key.includes(term)));
}

function validateExternalSimulationTelemetry(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'JSON payload required' };
  const robot = getRobot(payload.robot_id || payload.robotId);
  if (!robot) return { ok: false, error: 'Unknown robot_id' };
  if (payload.mode !== 'simulation') return { ok: false, error: 'mode must be simulation' };
  if (containsPhysicalCommand(payload)) return { ok: false, error: 'Physical command fields are not accepted by simulation telemetry' };
  const telemetry = payload.telemetry;
  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) return { ok: false, error: 'telemetry object required' };
  const serialized = JSON.stringify(telemetry);
  if (serialized.length > 8000) return { ok: false, error: 'telemetry payload too large' };
  return { ok: true, robot, telemetry };
}

module.exports = {
  ROBOTS,
  getRobot,
  deterministicTelemetry,
  createSimulationSnapshot,
  createFleetPulse,
  containsPhysicalCommand,
  validateExternalSimulationTelemetry
};
