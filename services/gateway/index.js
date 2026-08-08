const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Service URLs ───────────────────────────────────────────
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  garden: process.env.GARDEN_SERVICE_URL || 'http://localhost:3002',
  bounty: process.env.BOUNTY_SERVICE_URL || 'http://localhost:3003',
  nft: process.env.NFT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
};

// ─── Proxy Routes ───────────────────────────────────────────
app.use('/api/auth', createProxyMiddleware({ target: SERVICES.auth, changeOrigin: true }));
app.use('/api/gardens', createProxyMiddleware({ target: SERVICES.garden, changeOrigin: true }));
app.use('/api/plants', createProxyMiddleware({ target: SERVICES.garden, changeOrigin: true }));
app.use('/api/bounties', createProxyMiddleware({ target: SERVICES.bounty, changeOrigin: true }));
app.use('/api/nfts', createProxyMiddleware({ target: SERVICES.nft, changeOrigin: true }));
app.use('/api/voting', createProxyMiddleware({ target: SERVICES.nft, changeOrigin: true }));
app.use('/api/reminders', createProxyMiddleware({ target: SERVICES.garden, changeOrigin: true }));
app.use('/api/notifications', createProxyMiddleware({ target: SERVICES.notification, changeOrigin: true }));

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const health = { status: 'ok', services: {} };
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(url + '/health', { signal: AbortSignal.timeout(3000) });
      health.services[name] = response.ok ? 'healthy' : 'unhealthy';
    } catch {
      health.services[name] = 'unreachable';
    }
  }
  const allHealthy = Object.values(health.services).every(s => s === 'healthy');
  res.status(allHealthy ? 200 : 503).json(health);
});

// ─── Service Discovery (Redis-based) ────────────────────────
const serviceRegistry = {
  register: async (name, url) => {
    // In production: use Redis SET with TTL
    console.log(`Service registered: ${name} at ${url}`);
  },
  deregister: async (name) => {
    console.log(`Service deregistered: ${name}`);
  },
  discover: async (name) => {
    return SERVICES[name];
  }
};

// ─── Error Handling ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal gateway error' });
});

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Services: ${Object.entries(SERVICES).map(([k, v]) => k + '=' + v).join(', ')}`);
});

module.exports = app;
