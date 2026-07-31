const express = require('express');
const {
  buildMonitoringDashboard,
  createMonitoringSnapshot,
  recoverUnhealthyServices
} = require('../services/monitoringService');
const { appendLog, readRecentLogs } = require('../services/logAggregator');
const { sendAlert } = require('../services/alertService');

function renderMonitoringPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MyZubster Monitoring</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f6f8fb; color: #17202a; }
    main { max-width: 1040px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 28px; margin: 0 0 18px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e8ec; }
    th { color: #52616f; font-size: 13px; text-transform: uppercase; }
    .status { font-weight: 700; }
    .online { color: #157347; }
    .offline, .critical { color: #b42318; }
    .degraded { color: #a15c00; }
    pre { background: #111827; color: #e5e7eb; padding: 14px; overflow: auto; }
  </style>
</head>
<body>
  <main>
    <h1>MyZubster Monitoring</h1>
    <p id="summary">Loading service status...</p>
    <table>
      <thead><tr><th>Service</th><th>Status</th><th>Details</th></tr></thead>
      <tbody id="services"></tbody>
    </table>
    <h2>Recent Logs</h2>
    <pre id="logs">Loading logs...</pre>
  </main>
  <script>
    async function loadDashboard() {
      const response = await fetch('/api/monitoring/dashboard');
      const data = await response.json();
      document.getElementById('summary').textContent = 'Overall status: ' + data.status + ' | Updated: ' + data.timestamp;
      document.getElementById('services').innerHTML = data.services.map((service) => {
        const details = Object.entries(service)
          .filter(([key]) => !['name', 'status'].includes(key))
          .map(([key, value]) => key + ': ' + (typeof value === 'object' ? JSON.stringify(value) : value))
          .join(' | ');
        return '<tr><td>' + service.name + '</td><td class="status ' + service.status + '">' + service.status + '</td><td>' + details + '</td></tr>';
      }).join('');
      document.getElementById('logs').textContent = data.logs.map((line) => JSON.stringify(line)).join('\\n');
    }
    loadDashboard();
    setInterval(loadDashboard, 30000);
  </script>
</body>
</html>`;
}

function createMonitoringRouter(options = {}) {
  const router = express.Router();
  const mongoose = options.mongoose;

  async function getSnapshot(req) {
    return createMonitoringSnapshot({
      mongooseConnection: mongoose && mongoose.connection,
      ssh: {
        enabled: req.query.ssh !== 'false'
      }
    });
  }

  router.get('/health', async (req, res) => {
    const snapshot = await getSnapshot(req);
    appendLog({ level: snapshot.status === 'healthy' ? 'info' : 'warn', message: 'Health check', snapshot });
    res.status(snapshot.status === 'critical' ? 503 : 200).json(snapshot);
  });

  router.get('/api/monitoring/status', async (req, res) => {
    res.json(await getSnapshot(req));
  });

  router.get('/api/monitoring/dashboard', async (req, res) => {
    const snapshot = await getSnapshot(req);
    res.json(buildMonitoringDashboard(snapshot, readRecentLogs({ limit: Number(req.query.limit) || 50 })));
  });

  router.get('/api/monitoring/logs', (req, res) => {
    res.json({
      success: true,
      logs: readRecentLogs({ limit: Number(req.query.limit) || 100 })
    });
  });

  router.post('/api/monitoring/recover', async (req, res) => {
    const snapshot = await getSnapshot(req);
    const enabled = req.body && req.body.execute === true;
    const recovery = await recoverUnhealthyServices(snapshot, { enabled });
    res.status(recovery.success ? 200 : 500).json({ success: recovery.success, snapshot, recovery });
  });

  router.post('/api/monitoring/alert-test', async (req, res) => {
    const snapshot = await getSnapshot(req);
    const alertResults = await sendAlert(snapshot, { message: req.body && req.body.message });
    res.json({ success: alertResults.some((result) => result.success), alertResults });
  });

  router.get('/monitoring', (req, res) => {
    res.type('html').send(renderMonitoringPage());
  });

  return router;
}

module.exports = {
  createMonitoringRouter,
  renderMonitoringPage
};
