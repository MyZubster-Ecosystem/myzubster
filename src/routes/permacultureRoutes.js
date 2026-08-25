const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/permacultureController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI planning requests; retry in one minute.' }
});

router.get('/', controller.listPublic);
router.get('/mine', authenticate, controller.listMine);
router.get('/nft/:metadataHash', controller.getNftMetadata);
router.post('/', authenticate, controller.create);
router.post('/:siteId/ai-plan', authenticate, aiLimiter, controller.generatePlan);
router.post('/:siteId/nft/prepare', authenticate, controller.prepareNft);
router.post('/:siteId/nft/simulate', authenticate, controller.simulateNft);
router.get('/:siteId/location/private', authenticate, controller.getPrivateLocation);
router.get('/:siteId', controller.getPublic);

module.exports = router;
