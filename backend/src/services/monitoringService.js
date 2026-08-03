const net = require('net');
const { execFile } = require('child_process');
const { appendLog } = require('./logAggregator');
const { sendAlert } = require('./alertService');

const MONGO_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeStatus(statuses) {
  if (statuses.some((status) => status === 'critical')) return 'critical';
  if (statuses.some((status) => status === 'offline' || status === 'degraded')) return 'degraded';
  return 'healthy';
}

function createBackendStatus() {
  return {
    name: 'backend',
    status: 'online',
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    pid: process.pid
  };
}

function createMongoStatus(connection) {
  const readyState = connection ? connection.readyState : 0;
  const status = readyState === 1 ? 'online' : 'offline';

  return {
    name: 'mongodb',
    status,
    readyState,
    state: MONGO_STATES[readyState] || 'unknown',
    host: connection && connection.host ? connection.host : process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster'
  };
}

function checkTcpPort(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    }

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ reachable: true }));
    socket.once('timeout', () => finish({ reachable: false, error: 'timeout' }));
    socket.once('error', (error) => finish({ reachable: false, error: error.code || error.message }));
    socket.connect(port, host);
  });
}

async function createSshStatus(options = {}) {
  const enabled = options.enabled !== undefined
    ? options.enabled
    : process.env.MONITOR_SSH_CHECK_ENABLED !== 'false';

  if (!enabled) {
    return { name: 'ssh', status: 'skipped', reason: 'ssh_check_disabled' };
  }

  const host = options.host || process.env.MONITOR_SSH_HOST || '127.0.0.1';
  const port = Number(options.port || process.env.MONITOR_SSH_PORT || 22);
  const timeoutMs = Number(options.timeoutMs || process.env.MONITOR_CHECK_TIMEOUT_MS || 1500);
  const startedAt = Date.now();
  const result = await checkTcpPort(host, port, timeoutMs);

  return {
    name: 'ssh',
    status: result.reachable ? 'online' : 'offline',
    host,
    port,
    latencyMs: Date.now() - startedAt,
    error: result.error || null
  };
}

async function createMonitoringSnapshot(options = {}) {
  const services = {
    backend: options.backendStatus || createBackendStatus(),
    mongodb: options.mongoStatus || createMongoStatus(options.mongooseConnection),
    ssh: options.sshStatus || await createSshStatus(options.ssh || {})
  };

  const status = normalizeStatus(Object.values(services).map((service) => service.status));

  return {
    success: status !== 'critical',
    status,
    timestamp: nowIso(),
    services,
    summary: {
      online: Object.values(services).filter((service) => service.status === 'online').length,
      degraded: Object.values(services).filter((service) => service.status === 'degraded').length,
      offline: Object.values(services).filter((service) => service.status === 'offline').length,
      skipped: Object.values(services).filter((service) => service.status === 'skipped').length
    }
  };
}

function buildMonitoringDashboard(snapshot, logs = []) {
  return {
    success: true,
    timestamp: nowIso(),
    status: snapshot.status,
    services: Object.values(snapshot.services),
    incidents: Object.values(snapshot.services)
      .filter((service) => service.status === 'offline' || service.status === 'degraded')
      .map((service) => ({
        service: service.name,
        status: service.status,
        error: service.error || service.state || null,
        detectedAt: snapshot.timestamp
      })),
    logs
  };
}

function getRecoveryActions(snapshot, options = {}) {
  const mode = options.mode || process.env.MONITOR_RECOVERY_MODE || 'pm2';
  const pm2App = options.pm2App || process.env.PM2_APP_NAME || 'myzubster-backend';
  const systemdBackend = options.systemdBackend || process.env.SYSTEMD_BACKEND_SERVICE || 'myzubster-backend';
  const systemdMongo = options.systemdMongo || process.env.SYSTEMD_MONGO_SERVICE || 'mongod';
  const systemdSsh = options.systemdSsh || process.env.SYSTEMD_SSH_SERVICE || 'ssh';
  const actions = [];

  const services = snapshot.services || {};
  if (services.backend && services.backend.status !== 'online') {
    actions.push(mode === 'systemd'
      ? { service: 'backend', command: 'systemctl', args: ['restart', systemdBackend] }
      : { service: 'backend', command: 'pm2', args: ['restart', pm2App] });
  }

  if (services.mongodb && services.mongodb.status === 'offline') {
    actions.push({ service: 'mongodb', command: 'systemctl', args: ['restart', systemdMongo] });
  }

  if (services.ssh && services.ssh.status === 'offline') {
    actions.push({ service: 'ssh', command: 'systemctl', args: ['restart', systemdSsh] });
  }

  return actions;
}

function runCommand(command, args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        command,
        args,
        stdout: stdout ? stdout.trim() : '',
        stderr: stderr ? stderr.trim() : '',
        error: error ? error.message : null
      });
    });
  });
}

async function recoverUnhealthyServices(snapshot, options = {}) {
  const enabled = options.enabled !== undefined
    ? options.enabled
    : process.env.MONITOR_AUTO_RECOVERY === 'true';
  const runner = options.runner || runCommand;
  const actions = getRecoveryActions(snapshot, options);

  if (!enabled) {
    return {
      success: true,
      skipped: true,
      reason: 'auto_recovery_disabled',
      actions
    };
  }

  const results = [];
  for (const action of actions) {
    appendLog({ level: 'warn', message: `Recovering ${action.service}`, action });
    results.push({
      service: action.service,
      ...(await runner(action.command, action.args, options.timeoutMs))
    });
  }

  return {
    success: results.every((result) => result.success),
    skipped: false,
    actions,
    results
  };
}

function startAutoRecoveryLoop(options = {}) {
  const enabled = options.enabled !== undefined
    ? options.enabled
    : process.env.MONITOR_AUTO_RECOVERY === 'true';

  if (!enabled) {
    return null;
  }

  const intervalMs = Number(options.intervalMs || process.env.MONITOR_INTERVAL_MS || 60000);
  const getSnapshot = options.getSnapshot;

  const timer = setInterval(async () => {
    try {
      const snapshot = await getSnapshot();
      appendLog({ level: snapshot.status === 'healthy' ? 'info' : 'warn', message: 'Monitoring snapshot', snapshot });

      if (snapshot.status !== 'healthy') {
        const recovery = await recoverUnhealthyServices(snapshot, { enabled: true, ...options });
        const alertResults = await sendAlert(snapshot, options.alert || {});
        appendLog({ level: 'warn', message: 'Auto-recovery cycle completed', recovery, alertResults });
      }
    } catch (error) {
      appendLog({ level: 'error', message: 'Auto-recovery loop failed', error: error.message });
    }
  }, intervalMs);

  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}

module.exports = {
  buildMonitoringDashboard,
  checkTcpPort,
  createBackendStatus,
  createMongoStatus,
  createMonitoringSnapshot,
  createSshStatus,
  getRecoveryActions,
  normalizeStatus,
  recoverUnhealthyServices,
  runCommand,
  startAutoRecoveryLoop
};
