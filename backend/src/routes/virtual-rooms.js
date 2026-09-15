const express = require('express');
const { authenticate, optionalAuthenticate } = require('../../../src/middleware/auth');
const {
  createRoom,
  listDiscoverableRooms,
  findRoom,
  updateRoom,
  createRoomInvite,
  getRoomInviteStatus,
  revokeRoomInvite,
  redeemRoomInvite,
  createSession,
  cancelSession,
  startSession,
  joinSession,
  leaveSession,
  endSession,
  getSessionToken,
  listSessionParticipants,
  moderateSessionParticipant,
  getStageStatus,
  requestStageAccess,
  leaveStage,
  listStageRequests,
  listStageSpeakers,
  revokeStageSpeaker,
  resolveStageRequest,
  listRoomBlockedParticipants,
  unblockRoomParticipant,
  publicRoom,
  publicSession,
  findCurrentSessionForRoom,
  findSession
} = require('../services/virtualRoomLifecycle');
const { appendSessionEvent, listSessionEvents } = require('../services/virtualSessionEvents');
const { listRoomMessages, createRoomMessage, deleteRoomMessage, reportRoomMessage, listRoomMessageReports, resolveRoomMessageReport, moderateReportedRoomMessage } = require('../services/virtualRoomChat');

const router = express.Router();

function roomAccess(room, req) {
  const actorUserId = String(req.userId || '');
  const canManage = Boolean(actorUserId && (
    actorUserId === String(room.hostUserId) || req.userRole === 'admin'
  ));
  if (['draft', 'archive'].includes(room.state) && !canManage) {
    return { allowed: false, canManage };
  }
  if (room.accessPolicy === 'authenticated' && !actorUserId) {
    return { allowed: false, canManage };
  }
  if (
    room.accessPolicy === 'private'
    && !canManage
    && !(room.allowedUserIds || []).includes(actorUserId)
  ) {
    return { allowed: false, canManage };
  }
  return { allowed: true, canManage };
}

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Metaverse-Lifecycle', 'server-authoritative');
  next();
});

router.get('/rooms', optionalAuthenticate, async (req, res) => {
  try {
    const rooms = await listDiscoverableRooms({ authenticated: Boolean(req.userId) });
    return res.json({ success: true, rooms, experimental: true });
  } catch (error) {
    console.error('Virtual room discovery error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to list rooms' });
  }
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
    const access = roomAccess(room, req);
    if (!access.allowed) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    const session = await findCurrentSessionForRoom(room.roomId);
    const joined = Boolean(
      req.userId
      && (session?.participantUserIds || []).includes(String(req.userId))
    );
    return res.json({
      success: true,
      room: publicRoom(room),
      session: publicSession(session),
      canManage: access.canManage,
      joined
    });
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

router.get('/rooms/:idOrSlug/invitations/status', authenticate, async (req, res) => {
  try {
    const result = await getRoomInviteStatus({
      idOrSlug: req.params.idOrSlug,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid
      ? { success: true, invitation: result.invitation }
      : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room invitation status error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read invitation status' });
  }
});

router.delete('/rooms/:idOrSlug/invitations', authenticate, async (req, res) => {
  try {
    const result = await revokeRoomInvite({
      idOrSlug: req.params.idOrSlug,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid
      ? { success: true, invitation: result.invitation }
      : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room invitation revoke error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to revoke invitation' });
  }
});

router.post('/rooms/:idOrSlug/invitations', authenticate, async (req, res) => {
  try {
    const result = await createRoomInvite({
      idOrSlug: req.params.idOrSlug,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid
      ? { success: true, inviteCode: result.code, expiresAt: result.expiresAt }
      : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room invitation create error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to create invitation' });
  }
});

router.post('/rooms/:idOrSlug/invitations/redeem', authenticate, async (req, res) => {
  try {
    const result = await redeemRoomInvite({
      idOrSlug: req.params.idOrSlug,
      actorUserId: req.userId,
      code: req.body?.code
    });
    return res.status(result.status).json(result.valid
      ? { success: true, room: result.room }
      : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room invitation redeem error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to redeem invitation' });
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
    const room = await findRoom(session.roomId);
    const access = room ? roomAccess(room, req) : { allowed: false };
    if (!access.allowed) return res.status(404).json({ success: false, error: 'Session not found' });
    const joined = Boolean(
      req.userId
      && (session.participantUserIds || []).includes(String(req.userId))
    );
    return res.json({ success: true, session: publicSession(session), joined });
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
    const access = room ? roomAccess(room, req) : { allowed: false };
    if (!access.allowed) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const stream = await listSessionEvents({ sessionId: req.params.id, after: req.query.after, limit: req.query.limit });
    return res.status(stream.status === 'unavailable' ? 503 : 200).json({ success: stream.status === 'ok', ...stream });
  } catch (error) {
    console.error('Virtual session event stream error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read session events' });
  }
});

router.get('/rooms/:idOrSlug/blocklist', authenticate, async (req, res) => {
  try {
    const result = await listRoomBlockedParticipants({ idOrSlug: req.params.idOrSlug, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true, participants: result.participants } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room blocklist error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read blocklist' });
  }
});

router.delete('/rooms/:idOrSlug/blocklist/:participantRef', authenticate, async (req, res) => {
  try {
    const result = await unblockRoomParticipant({
      idOrSlug: req.params.idOrSlug,
      participantRef: req.params.participantRef,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid ? { success: true } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room unblock error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to restore participant access' });
  }
});

router.get('/sessions/:id/participants', authenticate, async (req, res) => {
  try {
    const result = await listSessionParticipants({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true, participants: result.participants } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session participant list error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to list participants' });
  }
});

router.delete('/sessions/:id/participants/:participantRef', authenticate, async (req, res) => {
  try {
    const result = await moderateSessionParticipant({
      sessionId: req.params.id,
      participantRef: req.params.participantRef,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user',
      block: req.body?.block === true
    });
    if (result.valid) await appendSessionEvent({ session: result.session, type: result.action });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session, action: result.action } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session moderation error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to moderate participant' });
  }
});

router.get('/sessions/:id/stage', authenticate, async (req, res) => {
  try {
    const result = await getStageStatus({ sessionId: req.params.id, actorUserId: req.userId });
    return res.status(result.status).json(result.valid ? { success: true, stage: result.stage } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to read stage status' });
  }
});

router.post('/sessions/:id/stage/requests', authenticate, async (req, res) => {
  try {
    const result = await requestStageAccess({ sessionId: req.params.id, actorUserId: req.userId });
    return res.status(result.status).json(result.valid ? { success: true, stage: result.stage } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to request stage access' });
  }
});

router.delete('/sessions/:id/stage', authenticate, async (req, res) => {
  try {
    const result = await leaveStage({ sessionId: req.params.id, actorUserId: req.userId });
    if (result.valid && result.changed) await appendSessionEvent({ session: result.session, type: result.action });
    return res.status(result.status).json(result.valid ? { success: true, stage: result.stage } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to leave stage' });
  }
});

router.get('/sessions/:id/stage/speakers', authenticate, async (req, res) => {
  try {
    const result = await listStageSpeakers({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true, speakers: result.speakers } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to list stage speakers' });
  }
});

router.delete('/sessions/:id/stage/speakers/:participantRef', authenticate, async (req, res) => {
  try {
    const result = await revokeStageSpeaker({ sessionId: req.params.id, participantRef: req.params.participantRef, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    if (result.valid) await appendSessionEvent({ session: result.session, type: result.action });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to revoke stage access' });
  }
});

router.get('/sessions/:id/stage/requests', authenticate, async (req, res) => {
  try {
    const result = await listStageRequests({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true, requests: result.requests } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to list stage requests' });
  }
});

router.patch('/sessions/:id/stage/requests/:participantRef', authenticate, async (req, res) => {
  try {
    const result = await resolveStageRequest({ sessionId: req.params.id, participantRef: req.params.participantRef, actorUserId: req.userId, actorRole: req.userRole || 'user', approve: req.body?.approve === true });
    if (result.valid) await appendSessionEvent({ session: result.session, type: result.action });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session, action: result.action } : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to resolve stage request' });
  }
});

router.post('/sessions/:id/cancel', authenticate, async (req, res) => {
  try {
    const result = await cancelSession({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    if (result.valid) await appendSessionEvent({ session: result.session, type: 'session_cancelled' });
    return res.status(result.status).json(result.valid ? { success: true, session: result.session } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual session cancel error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to cancel session' });
  }
});

router.get('/sessions/:id/messages', authenticate, async (req, res) => {
  try {
    const result = await listRoomMessages({ sessionId: req.params.id, actorUserId: req.userId, after: req.query.after });
    return res.status(result.status).json(result.valid ? {
      success: true, messages: result.messages, cursor: result.cursor, retentionSeconds: result.retentionSeconds
    } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room chat read error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to read room chat' });
  }
});

router.delete('/sessions/:id/messages/:messageId', authenticate, async (req, res) => {
  try {
    const result = await deleteRoomMessage({
      sessionId: req.params.id,
      messageId: req.params.messageId,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid ? { success: true } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room chat moderation error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to remove room message' });
  }
});

router.post('/sessions/:id/messages/:messageId/reports', authenticate, async (req, res) => {
  try {
    const result = await reportRoomMessage({ sessionId: req.params.id, messageId: req.params.messageId, actorUserId: req.userId, reason: req.body?.reason });
    return res.status(result.status).json(result.valid ? { success: true, report: result.report } : { success: false, error: result.error });
  } catch (error) { return res.status(500).json({ success: false, error: 'Unable to report room message' }); }
});

router.get('/sessions/:id/message-reports', authenticate, async (req, res) => {
  try {
    const result = await listRoomMessageReports({ sessionId: req.params.id, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true, reports: result.reports } : { success: false, error: result.error });
  } catch (error) { return res.status(500).json({ success: false, error: 'Unable to list message reports' }); }
});

router.patch('/sessions/:id/message-reports/:reportId', authenticate, async (req, res) => {
  try {
    const result = await resolveRoomMessageReport({ sessionId: req.params.id, reportId: req.params.reportId, actorUserId: req.userId, actorRole: req.userRole || 'user' });
    return res.status(result.status).json(result.valid ? { success: true } : { success: false, error: result.error });
  } catch (error) { return res.status(500).json({ success: false, error: 'Unable to resolve message report' }); }
});

router.delete('/sessions/:id/message-reports/:reportId/message', authenticate, async (req, res) => {
  try {
    const result = await moderateReportedRoomMessage({
      sessionId: req.params.id,
      reportId: req.params.reportId,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user'
    });
    return res.status(result.status).json(result.valid
      ? { success: true, removed: result.removed, messageId: result.messageId }
      : { success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to moderate reported message' });
  }
});

router.post('/sessions/:id/messages', authenticate, async (req, res) => {
  try {
    const result = await createRoomMessage({ sessionId: req.params.id, actorUserId: req.userId, text: req.body?.text });
    return res.status(result.status).json(result.valid ? { success: true, message: result.message } : { success: false, error: result.error });
  } catch (error) {
    console.error('Virtual room chat write error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to send room message' });
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
