const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/permacultureController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const photoParser = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '8mb' });
const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many photo analyses; retry in one minute.' }
});

router.post('/:siteId/photo-analysis', authenticate, visionLimiter, photoParser, controller.analyzePhoto);
router.get('/:siteId/photo-analysis/latest', authenticate, controller.getLatestPhotoAnalysis);

module.exports = router;
