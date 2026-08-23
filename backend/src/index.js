require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bountyPaymentRoutes = require('./routes/bounty-payments');
const bountyRoutes = require('./routes/bounties');
const mongoose = require('mongoose');
const gatewayRoutes = require('./routes/gateway');
const daoRoutes = require('./routes/dao');
const zorgaxDaoRoutes = require('./routes/zorgax-dao');

const gardenRoutes = require('./routes/gardens');
const telemetryRoutes = require('./routes/telemetry');

const app = express();
const PORT = Number(process.env.PORT) || 3009;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster';

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/gardens', gardenRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/dao/zorgax', zorgaxDaoRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/bounties', bountyRoutes);

app.get('/api/dashboard', (_req, res) => {
  res.json({
    success: true,
    services: {
      github: { status: 'online', endpoint: 'https://api.github.com' },
      geocoding: { status: 'online', endpoint: 'https://nominatim.openstreetmap.org' },
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'online' : 'offline',
        endpoint: 'mongodb://localhost:27017'
      },
      dao: { status: 'online', endpoint: '/api/dao' },
      zorgaxGovernance: { status: 'advisory', endpoint: '/api/dao/zorgax', binding: false },
      bounties: { status: 'online', endpoint: '/api/bounties', source: 'bounty-engine/registry-v2.json' }
    },
    stats: {
      totalIssues: 0,
      openIssues: 0,
      closedIssues: 0,
      totalBounties: 0,
      activeBounties: 0,
      totalContributors: 0
    }
  });
});

app.use('/api/bounty-payments', bountyPaymentRoutes);

app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const messages = [
    {
      id: 'msg1',
      userId,
      content: 'Benvenuto su MyZubster! 🌱',
      timestamp: new Date().toISOString(),
      type: 'welcome',
      read: false
    }
  ];

  res.json({
    success: true,
    userId,
    messages,
    count: messages.length,
    unread: messages.filter((message) => !message.read).length
  });
});

app.post('/api/payments/record', (req, res) => {
  try {
    const { issueId, bounty, contributor, txid, address } = req.body || {};
    const { notifier } = require('../../services/notification/bot');
    const payment = notifier.recordPayment(issueId, bounty, contributor, txid, address);
    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).json({ success: false, error: 'Unable to record payment' });
  }
});

app.get('/api/payments/status', (_req, res) => {
  try {
    const { notifier } = require('../../services/notification/bot');
    res.json(notifier.getPaymentStatus());
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ success: false, error: 'Unable to read payment status' });
  }
});

app.get('/dashboard', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MyZubster Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 40px auto; padding: 0 20px; background: #f6f7f9; color: #172033; }
    .card { background: white; border: 1px solid #e1e5ea; border-radius: 12px; padding: 20px; margin: 16px 0; }
    code { background: #eef1f5; padding: 2px 6px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🚀 MyZubster Dashboard</h1>
  <div class="card">
    <strong>Backend:</strong> online<br>
    <strong>Health:</strong> <a href="/health"><code>/health</code></a><br>
    <strong>Dashboard API:</strong> <a href="/api/dashboard"><code>/api/dashboard</code></a><br>
    <strong>Bounty Registry API:</strong> <a href="/api/bounties"><code>/api/bounties</code></a><br>
    <strong>Gardens API:</strong> <a href="/api/gardens"><code>/api/gardens</code></a><br>
    <strong>DAO API:</strong> <a href="/api/dao/proposals"><code>/api/dao/proposals</code></a><br>
    <strong>Zorgax DAO:</strong> <a href="/api/dao/zorgax/status"><code>/api/dao/zorgax/status</code></a> (advisory, non-binding)
  </div>
</body>
</html>`);
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

async function startServer() {
  await connectDatabase();

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`✅ MyZubster backend listening on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`📍 Bounties: http://localhost:${PORT}/api/bounties`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start MyZubster backend:', error);
    process.exit(1);
  });
}

// Export the Express app directly so Supertest/Jest can require() it.
// Keep lifecycle helpers attached for callers that need explicit DB/server control.
app.startServer = startServer;
app.connectDatabase = connectDatabase;
app.disconnectDatabase = disconnectDatabase;

module.exports = app;
