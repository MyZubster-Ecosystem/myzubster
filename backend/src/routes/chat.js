const express = require('express');
const { authenticate } = require('../../../src/middleware/auth');
const {
  createDirectChannel,
  ensureCommunityChannel,
  persistMessage,
  listMessages
} = require('../services/chatMessaging');

const router = express.Router();

router.post('/channels/direct', authenticate, async (req, res) => {
  const result = await createDirectChannel({ actorUserId: req.userId, otherUserId: req.body?.userId });
  return res.status(result.status).json(result);
});

router.post('/channels/community', authenticate, async (req, res) => {
  const result = await ensureCommunityChannel({ actorUserId: req.userId, actorRole: req.userRole, communityId: req.body?.communityId });
  return res.status(result.status).json(result);
});

router.post('/channels/:channelId/messages', authenticate, async (req, res) => {
  const result = await persistMessage({
    actorUserId: req.userId,
    actorRole: req.userRole,
    channelId: req.params.channelId,
    clientMessageId: req.body?.clientMessageId,
    body: req.body?.body
  });
  return res.status(result.status).json(result);
});

router.get('/channels/:channelId/messages', authenticate, async (req, res) => {
  const result = await listMessages({
    actorUserId: req.userId,
    actorRole: req.userRole,
    channelId: req.params.channelId,
    after: req.query.after || null,
    limit: req.query.limit
  });
  return res.status(result.status).json(result);
});

module.exports = router;
