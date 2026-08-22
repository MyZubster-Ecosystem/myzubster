const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const controller = require('../controllers/nftController');

const router = express.Router();
const marketplaceWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', controller.listMarketplace);

// Marketplace reads are public; every state-changing operation is authenticated and rate-limited.
router.post('/list', marketplaceWriteLimiter, auth.authenticate, controller.createListing);
router.post('/:listingId/confirm-sale', marketplaceWriteLimiter, auth.authenticate, controller.confirmSale);
router.post('/:listingId/cancel', marketplaceWriteLimiter, auth.authenticate, controller.cancelListing);

module.exports = router;
