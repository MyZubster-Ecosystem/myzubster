const express = require('express');
const router = express.Router();
const ac = require('../controllers/adminDashboardController');
const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured' });
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
module.exports = router;
