const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status
router.get('/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Info
router.get('/info', (req, res) => {
  res.json({
    name: 'MyZubster Gateway',
    version: '1.0.0',
    description: 'Monero Payment Gateway & Animal Registry',
    features: {
      payments: process.env.ENABLE_PAYMENTS === 'true',
      animals: process.env.ENABLE_ANIMAL_REGISTRY === 'true',
      plants: process.env.ENABLE_PLANT_REGISTRY === 'true',
      bounty: process.env.ENABLE_BOUNTY_PROGRAM === 'true'
    },
    monero_wallet: process.env.MONERO_MAIN_WALLET_ADDRESS
  });
});

module.exports = router;
