const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const controller = require('../controllers/walletController');

const router = express.Router();
const walletWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(auth.authenticate);
router.post('/challenge', walletWriteLimiter, controller.createChallenge);
router.post('/verify', walletWriteLimiter, controller.verifySignature);
router.get('/me', controller.listMyWallets);

module.exports = router;
