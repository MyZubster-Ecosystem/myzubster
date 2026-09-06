const express = require('express');
const { authenticate, optionalAuthenticate } = require('../../../src/middleware/auth');
const {
  createRoom,
  findRoom,
  updateRoom,
  createSession,
  startSession,
  joinSession,
  leaveSession,
  endSession,
  getSessionToken,
  publicRoom,
  publicSession,
  findSession
} = require('../services/virtualRoomLifecycle');
const { appendSessionEvent, listSessionEvents } = require('../services/virtualSessionEvents');

const router = express.Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Metaverse-Lifecycle', 'server-authoritative');
  next();
});

router.post('/rooms', authenticate, async (req, res) => {
  try {
    const result = await createRoom({
      actorUserId: req.userId,
      name: req.body?.name,
      slug: req.body?.slug,
      accessPolicy: req.body?.accessPolicy,
      capacity: req.body?.capacity,
      stagePolicy: req.body?.stagePolicy
    });
    return res.status(result.status).json(result.valid ? { success: true, room: result.room } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room create error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to create room' });
  }
});

router.get('/rooms/:idOrSlug', optionalAuthenticate, async (req, res) => {
  try {
    const room = await findRoom(req.params.idOrSlug);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    if (room.accessPolicy === 'private' && String(req.userId || '') !== String(room.hostUserId) && req.userRole !== 'admin') {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    return res.json({ success: true, room: publicRoom(room) });
  } catch (error) {
    console.error('Virtual room read error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read room' });
  }
});

router.patch('/rooms/:idOrSlug', authenticate, async (req, res) => {
  try {
    const result = await updateRoom({ idOrSlug: req.params.idOrSlug, actorUserId: req.userId, actorRole: req.userRole || 'user', patch: req.body || {} });
    return res.status(result.status).json(result.valid ? { success: true, room: result.room } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room update error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to update room' });
  }
});

router.post('/rooms/:id/sessions', authenticate, async (req, res) => {
  try {
    const result = await createSession({ roomId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'session_created' });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session create error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to create session' });
  }
});

router.get('/sessions/:id', optionalAuthenticate, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.json({ success: true, session: publicSession(session) });
  } catch (error) {
    console.error('Virtual session read error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read session' });
  }
});

router.get('/sessions/:id/events', optionalAuthenticate, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    const room = await findRoom(session.roomId);
    if (room?.accessPolicy === 'private' && String(req.userId || '') !== String(room.hostUserId) && req.userRole !== 'admin' && !(room.allowedUserIds || []).includes(String(req.userId || ''))) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const stream = await listSessionEvents({ sessionId: req.params.id, after: req.query.after, limit: req.query.limit });
    return res.status(stream.status === 'unavailable' ? 503 : 200).json({ success: stream.status === 'ok', ...stream });
  } catch (error) {
    console.error('Virtual session event stream error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read session events' });
  }
});

router.post('/sessions/:id/start', authenticate, async (req, res) => {
  try {
    const result = await startSession({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'session_started' });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session start error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to start session' });
  }
});

router.post('/sessions/:id/join', authenticate, async (req, res) => {
  try {
    const result = await joinSession({ sessionId: req.params.id, actorUserId: req.userId });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'participant_joined' });
    return res.status(result.status).json(result.valid ? {
      success: true,
      session: result.session,
      realtimeToken: result.token,
      sceneManifestVersion: result.session.sceneManifestVersion
    } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session join error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to join session' });
  }
});

router.post('/sessions/:id/leave', authenticate, async (req, res) => {
  try {
    const result = await leaveSession({ sessionId: req.params.id, actorUserId: req.userId });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'participant_left' });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session leave error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to leave session' });
  }
});

router.post('/sessions/:id/end', authenticate, async (req, res) => {
  try {
    const result = await endSession({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'session_ended' });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session end error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to end session' });
  }
});

router.get('/sessions/:id/token', authenticate, async (req, res) => {
  try {
    const result = await getSessionToken({ sessionId: req.params.id, actorUserId: req.userId });
    return res.status(result.status).json(result.valid ? {
      success: true,
      realtimeToken: result.token,
      expiresInSeconds: 300,
      sceneManifestVersion: result.sceneManifestVersion
    } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session token error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to issue realtime token' });
  }
});

module.exports = router;
