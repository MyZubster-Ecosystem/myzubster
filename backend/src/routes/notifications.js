const express = require('express');
const { authenticate } = require('../../../src/middleware/auth');
const { listNotifications, markRead, setPreference } = require('../services/notificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const result = await listNotifications({
    userId: req.userId,
    unreadOnly: String(req.query.unreadOnly || '').toLowerCase() === 'true',
    limit: req.query.limit,
    before: req.query.before || null
  });
  return res.status(result.status).json(result);
});

router.post('/:notificationId/read', authenticate, async (req, res) => {
  const result = await markRead({ userId: req.userId, notificationId: req.params.notificationId });
  return res.status(result.status).json(result);
});

router.put('/preferences/:category', authenticate, async (req, res) => {
  const result = await setPreference({
    userId: req.userId,
    category: req.params.category,
    inProductEnabled: req.body?.inProductEnabled
  });
  return res.status(result.status).json(result);
});

module.exports = router;
