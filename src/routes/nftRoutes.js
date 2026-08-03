const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/', nftController.getAll);
router.get('/stats', nftController.getMarketplaceStats);
router.get('/:id', nftController.getOne);

// Authenticated
router.post('/mint', authenticate, nftController.mint);
router.get('/gallery/me', authenticate, nftController.getUserGallery);
router.get('/gallery/:userId', nftController.getUserGallery);
router.patch('/:id/list', authenticate, nftController.listForSale);
router.patch('/:id/delist', authenticate, nftController.delist);
router.post('/:id/transfer', authenticate, nftController.transfer);

module.exports = router;
