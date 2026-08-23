const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
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

router.post('/qa', auth, rewardController.createQAReward);
router.post('/robot-bonus', auth, rewardController.createRobotBonus);
router.post('/referral', auth, rewardController.createReferralReward);
router.post('/education', auth, rewardController.createEducationReward);
router.post('/governance/vote', auth, rewardController.createGovernanceVoteReward);
router.post('/governance/delegation', auth, rewardController.createGovernanceDelegationReward);
router.get('/', rewardController.listRewards);
router.get('/stats', auth, admin, rewardController.getStats);
router.get('/:rewardId', rewardController.getReward);
router.post('/:rewardId/approve', auth, admin, rewardController.approveReward);

module.exports = router;
