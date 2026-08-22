const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/walletController');

const router = express.Router();

router.use(auth.authenticate);
router.post('/challenge', controller.createChallenge);
router.post('/verify', controller.verifySignature);
router.get('/me', controller.listMyWallets);

module.exports = router;
