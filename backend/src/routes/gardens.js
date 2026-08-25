const express = require('express');

const router = express.Router();

// This standalone legacy API stored and returned precise garden coordinates and
// addresses without authentication, consent, or encryption. Keep it fail-closed.
// The privacy-ready implementation is src/routes/urbanGardenRoutes.js.
router.use((_req, res) => res.status(410).json({
  success: false,
  code: 'LEGACY_GARDEN_API_DISABLED',
  message: 'This legacy garden API is disabled. Use the privacy-ready authenticated garden API.'
}));

module.exports = router;
