const express = require('express');
const router = express.Router();
const ac = require('../controllers/adminDashboardController');
const jwt = require('jsonwebtoken');
const { _test: emailTest } = require('../services/adminNotificationEmailService');
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(503).json({ error: 'Authentication is not configured' });
  try { req.user = jwt.verify(token, secret); next(); }
  catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
};
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  next();
};
router.get('/overview', auth, admin, ac.getOverview);
router.get('/payments', auth, admin, ac.getPaymentMonitoring);
router.get('/jobs', auth, admin, ac.getJobMonitoring);
router.get('/health', auth, admin, ac.getSystemHealth);
router.post('/notifications/email/test', auth, admin, async (req, res) => {
  const result = await emailTest.sendAdminNotification('[MyZubster] Test notifica SMTP', [
    'Test controllato della configurazione SMTP MyZubster.',
    `Admin: ${req.user?.email || req.user?.id || req.user?._id || 'authenticated-admin'}`,
    `Data: ${new Date().toISOString()}`
  ]);
  if (!result.sent) {
    return res.status(result.reason === 'not-configured' ? 503 : 502).json({ success: false, reason: result.reason });
  }
  return res.json({ success: true, messageId: result.messageId || null });
});
module.exports = router;
