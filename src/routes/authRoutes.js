const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const emailProfileController = require('../controllers/emailProfileController');
const { authenticate } = require('../middleware/auth');

// Route pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/github/start', authController.githubStart);
router.get('/github/callback', authController.githubCallback);
router.post('/github/verify-ticket', authController.githubVerifyTicket);
router.get('/gmail/start', emailProfileController.gmailStart);
router.get('/gmail/callback', emailProfileController.gmailCallback);
router.post('/gmail/verify-ticket', emailProfileController.verifyDraft);
router.get('/gmail/auto-sync/cron', emailProfileController.runAutoSync);

// Route protette (richiedono autenticazione)
router.get('/profile', authenticate, authController.getProfile);
router.post('/gmail/apply-profile', authenticate, emailProfileController.applyDraft);
router.post('/gmail/auto-sync/start-url', authenticate, emailProfileController.autoSyncStartUrl);
router.get('/gmail/auto-sync/status', authenticate, emailProfileController.autoSyncStatus);
router.delete('/gmail/auto-sync', authenticate, emailProfileController.disableAutoSync);

module.exports = router;
