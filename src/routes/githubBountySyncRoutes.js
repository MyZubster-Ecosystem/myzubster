const express = require('express');
const jwt = require('jsonwebtoken');
const controller = require('../controllers/githubBountySyncController');

const router = express.Router();

function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(503).json({ ok: false, error: 'Authentication is not configured' });

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (_) {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

function admin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin required' });
  }
  next();
}

router.post('/webhook', controller.webhook);
router.post('/sync', auth, admin, controller.sync);

router.get('/admin', auth, admin, controller.listAdmin);
router.get('/admin/:issueNumber', auth, admin, controller.getOneAdmin);

router.get('/stats', controller.stats);
router.get('/:issueNumber', controller.getOne);
router.get('/', controller.list);

module.exports = router;
