const express = require('express');
const { authenticate } = require('../../../src/middleware/auth');
const {
  setInteractionControl,
  deliveryDecision,
  createReport,
  moderationAction,
  listModerationEvents
} = require('../services/realtimeModeration');

const router = express.Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Moderation-Mode', 'server-authoritative');
  next();
});

router.post('/controls/:kind', authenticate, async (req, res) => {
  try {
    const result = await setInteractionControl({
      ownerUserId: req.userId,
      targetUserId: req.body?.targetUserId,
      kind: req.params.kind,
      active: req.body?.active !== false
    });
    return res.status(result.status).json(result.valid ? { success: true, control: result.control } : { success: false, error: result.error });
  } catch (error) {
    console.error('Moderation control error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to update moderation control' });
  }
});

router.post('/delivery-check', authenticate, async (req, res) => {
  try {
    const decision = await deliveryDecision({ senderUserId: req.body?.senderUserId || req.userId, recipientUserId: req.body?.recipientUserId });
    return res.status(decision.status === 'unavailable' ? 503 : 200).json({ success: decision.status !== 'unavailable', decision });
  } catch (error) {
    console.error('Moderation delivery check error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to evaluate delivery policy' });
  }
});

router.post('/reports', authenticate, async (req, res) => {
  try {
    const result = await createReport({
      reporterUserId: req.userId,
      targetUserId: req.body?.targetUserId,
      contextType: req.body?.contextType,
      contextId: req.body?.contextId,
      reason: req.body?.reason
    });
    return res.status(result.status).json(result.valid ? { success: true, report: result.report } : { success: false, error: result.error });
  } catch (error) {
    console.error('Moderation report error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to create report' });
  }
});

router.post('/actions', authenticate, async (req, res) => {
  try {
    const result = await moderationAction({
      moderatorUserId: req.userId,
      moderatorRole: req.userRole,
      targetUserId: req.body?.targetUserId,
      action: req.body?.action,
      contextType: req.body?.contextType,
      contextId: req.body?.contextId
    });
    return res.status(result.status).json(result.valid ? { success: true, event: result.event } : { success: false, error: result.error });
  } catch (error) {
    console.error('Moderation action error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to apply moderation action' });
  }
});

router.get('/events', authenticate, async (req, res) => {
  try {
    if (!['admin', 'moderator'].includes(String(req.userRole || ''))) return res.status(403).json({ success: false, error: 'Moderator capability required' });
    const result = await listModerationEvents({ after: req.query.after });
    return res.status(result.status === 'unavailable' ? 503 : 200).json({ success: result.status === 'ok', ...result });
  } catch (error) {
    console.error('Moderation event feed error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read moderation events' });
  }
});

module.exports = router;
