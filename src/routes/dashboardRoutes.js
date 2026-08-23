const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  next();
};

router.get('/user/:userId', auth, dashboardController.getUserDashboard);
router.get('/robot/:robotId', auth, dashboardController.getRobotDashboard);
router.post('/transfer', auth, dashboardController.createP2PTransfer);
router.post('/checkout', auth, dashboardController.addCheckoutPayment);
router.post('/monero-webhook', dashboardController.handleMoneroWebhook);
router.get('/transactions', dashboardController.listTransactions);
router.get('/stats', auth, admin, dashboardController.getStats);

module.exports = router;
