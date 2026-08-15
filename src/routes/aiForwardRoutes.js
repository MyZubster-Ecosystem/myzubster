const express = require('express');
const router = express.Router();
const aiForwardController = require('../controllers/aiForwardController');

router.post('/quote', aiForwardController.getQuote);
router.post('/purchase', aiForwardController.purchaseContract);
router.get('/user/:userId', aiForwardController.getUserContracts);
router.post('/consume', aiForwardController.consumeTokens);
router.post('/resale', aiForwardController.listForResale);
router.get('/balance/:userId/:model', aiForwardController.getBalance);

module.exports = router;
