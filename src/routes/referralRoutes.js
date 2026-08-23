const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.post('/generate', auth, referralController.generateReferral);
router.get('/:code', referralController.getReferral);
router.post('/track', referralController.trackReferral);
router.post('/credit', auth, referralController.creditReferral);
router.get('/stats', auth, admin, referralController.getStats);

module.exports = router;
