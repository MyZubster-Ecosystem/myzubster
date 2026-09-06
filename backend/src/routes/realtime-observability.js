const express = require('express');
const { authenticate } = require('../../../src/middleware/auth');
const { snapshot } = require('../services/realtimeObservability');

const router = express.Router();

router.get('/metrics', authenticate, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ success: false, error: 'Admin role required' });
  return res.json({ success: true, realtime: snapshot() });
});

module.exports = router;
