const express = require('express');
const controller = require('../controllers/nftController');

const router = express.Router();

router.get('/', controller.listMarketplace);
router.post('/list', controller.createListing);
router.post('/:listingId/confirm-sale', controller.confirmSale);
router.post('/:listingId/cancel', controller.cancelListing);

module.exports = router;
