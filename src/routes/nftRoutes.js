const express = require('express');
const controller = require('../controllers/nftController');

const router = express.Router();

router.get('/', controller.listAssets);
router.post('/', controller.createDraft);
router.get('/:assetId', controller.getAsset);
router.post('/:assetId/confirm-mint', controller.confirmMint);

module.exports = router;
