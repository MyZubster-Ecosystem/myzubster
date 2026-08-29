const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/authController');
const socialAuthController = require('../controllers/socialAuthController');
const emailProfileController = require('../controllers/emailProfileController');
const { authenticate } = require('../middleware/auth');

function legacyOrSocialCallback(provider, legacyHandler) {
  return (req, res, next) => {
    const decoded = jwt.decode(String(req.query?.state || ''));
    if (decoded?.purpose === 'social-login' && decoded?.provider === provider) {
      req.params.provider = provider;
      return socialAuthController.callback(req, res, next);
    }
    return legacyHandler(req, res, next);
  };
}

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/github/start', authController.githubStart);
router.get('/github/callback', legacyOrSocialCallback('github', authController.githubCallback));
router.post('/github/verify-ticket', authController.githubVerifyTicket);
router.get('/social/providers', socialAuthController.providers);
router.get('/social/:provider/start', socialAuthController.start);
router.get('/social/:provider/callback', socialAuthController.callback);
router.post('/social/exchange-ticket', socialAuthController.exchangeTicket);
router.get('/gmail/start', emailProfileController.gmailStart);
router.get('/gmail/callback', legacyOrSocialCallback('google', emailProfileController.gmailCallback));
router.post('/gmail/verify-ticket', emailProfileController.verifyDraft);
router.get('/gmail/auto-sync/cron', emailProfileController.runAutoSync);
router.get('/profile', authenticate, authController.getProfile);
router.post('/gmail/apply-profile', authenticate, emailProfileController.applyDraft);
router.post('/gmail/auto-sync/start-url', authenticate, emailProfileController.autoSyncStartUrl);
router.get('/gmail/auto-sync/status', authenticate, emailProfileController.autoSyncStatus);
router.delete('/gmail/auto-sync', authenticate, emailProfileController.disableAutoSync);
module.exports = router;
