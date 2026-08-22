const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/nftController');

const router = express.Router();

router.get('/', controller.listAssets);
router.get('/:assetId', controller.getAsset);

// Public reads, authenticated writes.
router.post('/', auth.authenticate, controller.createDraft);
router.post('/:assetId/confirm-mint', auth.authenticate, controller.confirmMint);

module.exports = router;
