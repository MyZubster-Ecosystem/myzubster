const express = require('express');
const gateway = require('../services/gateway');

const router = express.Router();

// GET /api/gateway/status - report gateway reachability and configuration
router.get('/status', async (_req, res) => {
  try {
    const result = await gateway.health();
    res.json({
      success: true,
      configured: gateway.config.baseUrl,
      reachable: result.reachable,
      status: result.status,
      data: result.data,
    });
  } catch (error) {
    res.json({
      success: false,
      configured: gateway.config.baseUrl,
      reachable: false,
      error: error.message,
    });
  }
});

// POST /api/gateway/relay - forward a payload to the gateway
router.post('/relay', async (req, res) => {
  const body = req.body || {};
  try {
    const result = await gateway.relay(body);
    if (!result.ok) {
      return res.status(502).json({
        success: false,
        error: 'Gateway returned an error',
        gatewayStatus: result.status,
      });
    }
    res.json({ success: true, gatewayStatus: result.status, data: result.data });
  } catch (error) {
    res.status(502).json({ success: false, error: 'Gateway unreachable: ' + error.message });
  }
});

module.exports = router;
