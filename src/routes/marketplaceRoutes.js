const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/nftController');

const router = express.Router();

router.get('/', controller.listMarketplace);

// Marketplace reads are public; every state-changing operation is authenticated.
router.post('/list', auth.authenticate, controller.createListing);
router.post('/:listingId/confirm-sale', auth.authenticate, controller.confirmSale);
router.post('/:listingId/cancel', auth.authenticate, controller.cancelListing);

module.exports = router;
