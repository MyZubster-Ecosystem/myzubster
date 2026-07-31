const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const {
  buildMonitoringDashboard,
  createMonitoringSnapshot,
  getRecoveryActions,
  normalizeStatus,
  recoverUnhealthyServices
} = require('../src/services/monitoringService');
const {
  appendLog,
  getLogPath,
  readRecentLogs
} = require('../src/services/logAggregator');
const { createMonitoringRouter } = require('../src/routes/monitoring');

describe('monitoring service', () => {
  test('classifies status from service states', () => {
    expect(normalizeStatus(['online', 'online'])).toBe('healthy');
    expect(normalizeStatus(['online', 'offline'])).toBe('degraded');
    expect(normalizeStatus(['online', 'critical'])).toBe('critical');
  });

  test('builds a monitoring snapshot for backend, MongoDB, and SSH', async () => {
    const snapshot = await createMonitoringSnapshot({
      mongoStatus: { name: 'mongodb', status: 'online', readyState: 1 },
      sshStatus: { name: 'ssh', status: 'online', host: '127.0.0.1', port: 22 }
    });

    expect(snapshot.success).toBe(true);
    expect(snapshot.status).toBe('healthy');
    expect(snapshot.services.backend.status).toBe('online');
    expect(snapshot.services.mongodb.status).toBe('online');
    expect(snapshot.services.ssh.status).toBe('online');
  });

  test('returns recovery actions for offline services', () => {
    const actions = getRecoveryActions({
      services: {
        backend: { name: 'backend', status: 'online' },
        mongodb: { name: 'mongodb', status: 'offline' },
        ssh: { name: 'ssh', status: 'offline' }
      }
    });

    expect(actions.map((action) => action.service)).toEqual(['mongodb', 'ssh']);
    expect(actions[0].command).toBe('systemctl');
  });

  test('previews recovery actions when execution is disabled', async () => {
    const recovery = await recoverUnhealthyServices({
      services: {
        backend: { name: 'backend', status: 'offline' },
        mongodb: { name: 'mongodb', status: 'online' },
        ssh: { name: 'ssh', status: 'online' }
      }
    }, { enabled: false });

    expect(recovery.skipped).toBe(true);
    expect(recovery.actions).toHaveLength(1);
    expect(recovery.actions[0].service).toBe('backend');
  });

  test('executes recovery through an injected runner', async () => {
    const calls = [];
    const recovery = await recoverUnhealthyServices({
      services: {
        backend: { name: 'backend', status: 'offline' },
        mongodb: { name: 'mongodb', status: 'online' },
        ssh: { name: 'ssh', status: 'online' }
      }
    }, {
      enabled: true,
      runner: async (command, args) => {
        calls.push({ command, args });
        return { success: true, command, args };
      }
    });

    expect(recovery.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('pm2');
  });

  test('builds dashboard incidents from unhealthy services', () => {
    const dashboard = buildMonitoringDashboard({
      status: 'degraded',
      timestamp: '2026-07-31T00:00:00.000Z',
      services: {
        backend: { name: 'backend', status: 'online' },
        mongodb: { name: 'mongodb', status: 'offline', error: 'disconnected' },
        ssh: { name: 'ssh', status: 'online' }
      }
    }, [{ message: 'hello' }]);

    expect(dashboard.incidents).toHaveLength(1);
    expect(dashboard.incidents[0].service).toBe('mongodb');
    expect(dashboard.logs).toHaveLength(1);
  });
});

describe('log aggregator', () => {
  test('writes, rotates, and reads recent JSON logs', () => {
    const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myzubster-monitor-'));
    const logPath = getLogPath({ logDir, fileName: 'test.log' });

    appendLog({ level: 'info', message: 'first' }, { logDir, fileName: 'test.log', maxBytes: 1024 });
    appendLog({ level: 'warn', message: 'second' }, { logDir, fileName: 'test.log', maxBytes: 1 });
    const logs = readRecentLogs({ logDir, fileName: 'test.log', limit: 5 });

    expect(fs.existsSync(logPath)).toBe(true);
    expect(logs[logs.length - 1].message).toBe('second');
    expect(fs.readdirSync(logDir).some((file) => file.startsWith('test.log.'))).toBe(true);
  });
});

describe('monitoring routes', () => {
  test('serves health and recovery preview endpoints', async () => {
    const app = express();
    app.use(express.json());
    app.use(createMonitoringRouter({
      mongoose: { connection: { readyState: 1, host: 'mongo' } }
    }));

    const health = await request(app).get('/health?ssh=false');
    expect(health.status).toBe(200);
    expect(health.body.services.mongodb.status).toBe('online');

    const recovery = await request(app).post('/api/monitoring/recover?ssh=false').send({});
    expect(recovery.status).toBe(200);
    expect(recovery.body.recovery.skipped).toBe(true);
  });

  test('serves dashboard HTML', async () => {
    const app = express();
    app.use(createMonitoringRouter());

    const response = await request(app).get('/monitoring');
    expect(response.status).toBe(200);
    expect(response.text).toContain('MyZubster Monitoring');
  });
});
