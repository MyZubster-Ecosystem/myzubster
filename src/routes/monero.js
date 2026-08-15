const express = require('express');
const router = express.Router();

// Endpoint per le route Monero
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Monero routes working'
  });
});

module.exports = router;
