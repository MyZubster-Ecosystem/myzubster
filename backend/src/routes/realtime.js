const express = require('express');
const crypto = require('crypto');
const { authenticate } = require('../../../src/middleware/auth');
const { mintSocketToken, TOKEN_TTL_SECONDS } = require('../services/realtimeGateway');
const { snapshot } = require('../services/realtimeObservability');

const router = express.Router();

router.post('/token', authenticate, (req, res) => {
  try {
    const correlationId = String(req.headers['x-request-id'] || crypto.randomUUID()).slice(0, 160);
    const token = mintSocketToken({
      userId: req.userId,
      role: req.userRole || 'user',
      username: req.username || null,
      correlationId
    });
    return res.json({
      success: true,
      token,
      expiresInSeconds: TOKEN_TTL_SECONDS,
      socketPath: '/realtime',
      transports: ['websocket', 'polling'],
      namespaces: ['user:{id}', 'community:{id}', 'session:{id}'],
      correlationId
    });
  } catch (error) {
    console.error('Realtime token error:', error?.name || 'Error');
    return res.status(503).json({ success: false, error: 'Realtime token unavailable' });
  }
});

router.get('/metrics', authenticate, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ success: false, error: 'Admin role required' });
  return res.json({ success: true, realtime: snapshot() });
});

module.exports = router;
