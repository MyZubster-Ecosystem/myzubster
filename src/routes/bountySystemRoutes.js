const express = require('express');
const router = express.Router();
const bountySystemController = require('../controllers/bountySystemController');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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

// Admin: Create/update bounty for an issue
router.post('/bounties', auth, admin, bountySystemController.createBounty);

// Public: List all bounties
router.get('/bounties', bountySystemController.listBounties);

// Public: Get bounty info for an issue
router.get('/bounties/:issueNumber', bountySystemController.getBounty);

// Webhook: GitHub PR merge handler (no auth - uses GitHub webhook secret)
router.post('/webhook', bountySystemController.processMerge);

// Admin: Get system stats
router.get('/stats', auth, admin, bountySystemController.getStats);

module.exports = router;
