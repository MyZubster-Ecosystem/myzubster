const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const VirtualRoom = require('../models/VirtualRoom');
const MetaverseCharacter = require('../models/MetaverseCharacter');
const VirtualSession = require('../models/VirtualSession');

const ROOM_TRANSITIONS = Object.freeze({
  draft: new Set(['published']),
  published: new Set(['scheduled', 'live']),
  scheduled: new Set(['live']),
  live: new Set(['ended']),
  ended: new Set(['archive']),
  archive: new Set([])
});

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function cleanText(value, maxLength = 160) {
  return String(value || '').replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

function hashRoomInviteCode(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function slugify(value) {
  return cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function publicRoom(room) {
  const value = typeof room?.toObject === 'function' ? room.toObject() : room;
  if (!value) return null;
  return {
    id: value.roomId,
    slug: value.slug,
    name: value.name,
    state: value.state,
    accessPolicy: value.accessPolicy,
    capacity: value.capacity,
    stagePolicy: value.stagePolicy,
    sceneManifestVersion: value.sceneManifestVersion,
    scheduledFor: value.scheduledFor || null
  };
}

function publicSession(session) {
  const value = typeof session?.toObject === 'function' ? session.toObject() : session;
  if (!value) return null;
  return {
    id: value.sessionId,
    roomId: value.roomId,
    state: value.state,
    capacity: value.capacity,
    participantCount: (value.participantUserIds || []).length,
    sceneManifestVersion: value.sceneManifestVersion,
    lifecycleVersion: value.lifecycleVersion,
    startedAt: value.startedAt || null,
    endedAt: value.endedAt || null
  };
}

function canManage(actorUserId, actorRole, hostUserId) {
  return Boolean(actorUserId && (actorRole === 'admin' || String(actorUserId) === String(hostUserId)));
}

async function createRoom({ actorUserId, name, slug, accessPolicy = 'authenticated', capacity = 100, stagePolicy = 'host-only' }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const safeName = cleanText(name, 120);
  const safeSlug = slugify(slug || name);
  if (!safeName || !safeSlug) return { valid: false, status: 400, error: 'Room name and slug are required' };
  if (!['public', 'authenticated', 'private'].includes(accessPolicy)) return { valid: false, status: 400, error: 'Invalid access policy' };
  if (!['host-only', 'host-approved'].includes(stagePolicy)) return { valid: false, status: 400, error: 'Invalid stage policy' };
  const numericCapacity = Number(capacity);
  if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 500) return { valid: false, status: 400, error: 'Capacity must be between 1 and 500' };

  const room = await VirtualRoom.create({
    roomId: crypto.randomUUID(),
    slug: safeSlug,
    name: safeName,
    hostUserId: String(actorUserId),
    accessPolicy,
    capacity: numericCapacity,
    stagePolicy
  });
  return { valid: true, status: 201, room: publicRoom(room) };
}

function roomDiscoveryQuery(authenticated = false) {
  return {
    state: { $in: ['published', 'scheduled', 'live'] },
    accessPolicy: authenticated ? { $in: ['public', 'authenticated'] } : 'public'
  };
}

async function listDiscoverableRooms({ authenticated = false, limit = 12 } = {}) {
  if (!databaseAvailable()) return [];
  const safeLimit = Math.min(24, Math.max(1, Number(limit) || 12));
  const rooms = await VirtualRoom.find(roomDiscoveryQuery(authenticated))
    .sort({ state: -1, scheduledFor: 1, updatedAt: -1 })
    .limit(safeLimit)
    .lean();
  return rooms.map(publicRoom);
}

async function findRoom(idOrSlug) {
  if (!databaseAvailable()) return null;
  const key = cleanText(idOrSlug, 160);
  return VirtualRoom.findOne({ $or: [{ roomId: key }, { slug: key }] });
}

async function updateRoom({ idOrSlug, actorUserId, actorRole, patch = {} }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const room = await findRoom(idOrSlug);
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };

  if (patch.state && patch.state !== room.state) {
    if (!ROOM_TRANSITIONS[room.state]?.has(patch.state)) return { valid: false, status: 409, error: `Invalid room transition ${room.state} -> ${patch.state}` };
    room.state = patch.state;
  }
  const settingsLocked = !['draft', 'published'].includes(room.state);
  if (settingsLocked && (patch.accessPolicy !== undefined || patch.capacity !== undefined || patch.stagePolicy !== undefined)) {
    return { valid: false, status: 409, error: 'Room access, capacity and stage policy are locked after session scheduling' };
  }

  if (patch.accessPolicy) {
    if (!['public', 'authenticated', 'private'].includes(patch.accessPolicy)) return { valid: false, status: 400, error: 'Invalid access policy' };
    room.accessPolicy = patch.accessPolicy;
  }
  if (patch.capacity !== undefined) {
    const numericCapacity = Number(patch.capacity);
    if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 500) return { valid: false, status: 400, error: 'Capacity must be between 1 and 500' };
    room.capacity = numericCapacity;
  }
  if (patch.stagePolicy !== undefined) {
    if (!['host-only', 'host-approved'].includes(patch.stagePolicy)) return { valid: false, status: 400, error: 'Invalid stage policy' };
    room.stagePolicy = patch.stagePolicy;
  }
  if (patch.sceneManifestVersion) room.sceneManifestVersion = cleanText(patch.sceneManifestVersion, 40);
  if (patch.scheduledFor !== undefined) room.scheduledFor = patch.scheduledFor ? new Date(patch.scheduledFor) : null;
  if (Array.isArray(patch.allowedUserIds)) room.allowedUserIds = patch.allowedUserIds.map((id) => cleanText(id, 120)).filter(Boolean);
  if (Array.isArray(patch.blockedUserIds)) room.blockedUserIds = patch.blockedUserIds.map((id) => cleanText(id, 120)).filter(Boolean);

  await room.save();
  return { valid: true, status: 200, room: publicRoom(room) };
}

async function createRoomInvite({ idOrSlug, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const room = await VirtualRoom.findOne({
    $or: [{ roomId: cleanText(idOrSlug, 160) }, { slug: cleanText(idOrSlug, 160) }]
  }).select('+inviteTokenHash +inviteExpiresAt');
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (room.accessPolicy !== 'private') return { valid: false, status: 409, error: 'Invitations are available only for private rooms' };
  if (['ended', 'archive'].includes(room.state)) return { valid: false, status: 409, error: 'Closed rooms cannot issue invitations' };

  const code = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  room.inviteTokenHash = hashRoomInviteCode(code);
  room.inviteExpiresAt = expiresAt;
  await room.save();
  return { valid: true, status: 201, code, expiresAt: expiresAt.toISOString() };
}

function publicInviteStatus(room) {
  const expiresAt = room?.inviteExpiresAt ? new Date(room.inviteExpiresAt) : null;
  const active = Boolean(room?.inviteTokenHash && expiresAt && expiresAt.getTime() > Date.now());
  return { active, expiresAt: active ? expiresAt.toISOString() : null };
}

async function getRoomInviteStatus({ idOrSlug, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const key = cleanText(idOrSlug, 160);
  const room = await VirtualRoom.findOne({ $or: [{ roomId: key }, { slug: key }] })
    .select('+inviteTokenHash +inviteExpiresAt');
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  return { valid: true, status: 200, invitation: publicInviteStatus(room) };
}

async function revokeRoomInvite({ idOrSlug, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const key = cleanText(idOrSlug, 160);
  const room = await VirtualRoom.findOne({ $or: [{ roomId: key }, { slug: key }] })
    .select('+inviteTokenHash +inviteExpiresAt');
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  room.inviteTokenHash = null;
  room.inviteExpiresAt = null;
  await room.save();
  return { valid: true, status: 200, invitation: publicInviteStatus(room) };
}

function roomInviteRedemptionQuery({ roomId, suppliedHash, actorUserId, now = new Date() }) {
  return {
    roomId: String(roomId),
    accessPolicy: 'private',
    inviteTokenHash: suppliedHash,
    inviteExpiresAt: { $gt: now },
    blockedUserIds: { $ne: String(actorUserId) }
  };
}

async function redeemRoomInvite({ idOrSlug, actorUserId, code }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const key = cleanText(idOrSlug, 160);
  const room = await VirtualRoom.findOne({ $or: [{ roomId: key }, { slug: key }] });
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!actorUserId) return { valid: false, status: 401, error: 'Authentication required' };
  if (room.accessPolicy !== 'private') return { valid: false, status: 409, error: 'Room does not require an invitation' };
  const actor = String(actorUserId);
  if ((room.blockedUserIds || []).includes(actor)) return { valid: false, status: 403, error: 'Access blocked' };
  if ((room.allowedUserIds || []).includes(actor) || actor === String(room.hostUserId)) {
    return { valid: true, status: 200, room: publicRoom(room) };
  }

  const claimedRoom = await VirtualRoom.findOneAndUpdate(
    roomInviteRedemptionQuery({
      roomId: room.roomId,
      suppliedHash: hashRoomInviteCode(code),
      actorUserId: actor
    }),
    {
      $addToSet: { allowedUserIds: actor },
      $set: { inviteTokenHash: null, inviteExpiresAt: null }
    },
    { new: true }
  );
  if (!claimedRoom) {
    return { valid: false, status: 410, error: 'Invitation invalid, expired, or already used' };
  }
  return { valid: true, status: 200, room: publicRoom(claimedRoom) };
}

async function createSession({ roomId, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const room = await findRoom(roomId);
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (!['published', 'scheduled'].includes(room.state)) return { valid: false, status: 409, error: 'Room must be published or scheduled before creating a session' };

  const session = await VirtualSession.create({
    sessionId: crypto.randomUUID(),
    roomId: room.roomId,
    hostUserId: room.hostUserId,
    state: 'scheduled',
    capacity: room.capacity,
    sceneManifestVersion: room.sceneManifestVersion
  });
  if (room.state === 'published') {
    room.state = 'scheduled';
    await room.save();
  }
  return { valid: true, status: 201, session: publicSession(session) };
}

async function findCurrentSessionForRoom(roomId) {
  if (!databaseAvailable()) return null;
  const safeRoomId = cleanText(roomId, 160);
  const live = await VirtualSession.findOne({ roomId: safeRoomId, state: 'live' })
    .sort({ createdAt: -1 });
  if (live) return live;
  return VirtualSession.findOne({ roomId: safeRoomId, state: 'scheduled' })
    .sort({ createdAt: -1 });
}

async function findSession(sessionId) {
  if (!databaseAvailable()) return null;
  return VirtualSession.findOne({ sessionId: cleanText(sessionId, 160) });
}

async function startSession({ sessionId, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (session.state !== 'scheduled') return { valid: false, status: 409, error: 'Only scheduled sessions can start' };
  session.state = 'live';
  session.startedAt = new Date();
  session.lifecycleVersion += 1;
  await session.save();
  await VirtualRoom.updateOne({ roomId: session.roomId }, { $set: { state: 'live' } });
  return { valid: true, status: 200, session: publicSession(session) };
}

async function validateJoin({ session, room, actorUserId }) {
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Session is not live' };
  const actor = String(actorUserId);
  if ((room.blockedUserIds || []).includes(actor)) return { valid: false, status: 403, error: 'Access blocked' };
  if (room.accessPolicy === 'private' && !(room.allowedUserIds || []).includes(actor) && actor !== String(room.hostUserId)) {
    return { valid: false, status: 403, error: 'Private room access denied' };
  }
  const current = new Set(session.participantUserIds || []);
  if (!current.has(actor) && current.size >= session.capacity) return { valid: false, status: 409, error: 'Session is at capacity' };
  return { valid: true };
}

async function joinSession({ sessionId, actorUserId }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  const room = await VirtualRoom.findOne({ roomId: session.roomId });
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  const access = await validateJoin({ session, room, actorUserId });
  if (!access.valid) return access;
  const actor = String(actorUserId);
  if (!(session.participantUserIds || []).includes(actor)) {
    session.participantUserIds.push(actor);
    session.lifecycleVersion += 1;
    await session.save();
  }
  return { valid: true, status: 200, session: publicSession(session), token: mintRealtimeToken(session, actor) };
}

async function leaveSession({ sessionId, actorUserId }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  const actor = String(actorUserId);
  session.participantUserIds = (session.participantUserIds || []).filter((id) => id !== actor);
  session.stageRequestUserIds = (session.stageRequestUserIds || []).filter((id) => id !== actor);
  session.stageSpeakerUserIds = (session.stageSpeakerUserIds || []).filter((id) => id !== actor);
  session.lifecycleVersion += 1;
  await session.save();
  return { valid: true, status: 200, session: publicSession(session) };
}

async function endSession({ sessionId, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Only live sessions can end' };
  session.state = 'ended';
  session.endedAt = new Date();
  session.lifecycleVersion += 1;
  await session.save();
  await VirtualRoom.updateOne({ roomId: session.roomId }, { $set: { state: 'ended' } });
  return { valid: true, status: 200, session: publicSession(session) };
}

function mintRealtimeToken(session, actorUserId) {
  const secret = process.env.REALTIME_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Realtime token secret is not configured');
  return jwt.sign({
    sub: String(actorUserId),
    purpose: 'metaverse-realtime',
    sessionId: session.sessionId,
    roomId: session.roomId,
    sceneManifestVersion: session.sceneManifestVersion
  }, secret, { expiresIn: '5m' });
}

function blockedParticipantRef(roomId, actorUserId) {
  return hashRoomInviteCode(`blocklist:${roomId}:${actorUserId}`).slice(0, 24);
}

async function listRoomBlockedParticipants({ idOrSlug, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const room = await findRoom(idOrSlug);
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  const ids = room.blockedUserIds || [];
  const characters = await MetaverseCharacter.find({ accountUserId: { $in: ids } })
    .select('accountUserId characterName archetype -_id')
    .lean();
  const byId = new Map(characters.map((character) => [String(character.accountUserId), character]));
  return {
    valid: true,
    status: 200,
    participants: ids.map((id) => ({
      ref: blockedParticipantRef(room.roomId, id),
      characterName: byId.get(String(id))?.characterName || 'Verified participant',
      archetype: byId.get(String(id))?.archetype || 'explorer'
    }))
  };
}

async function unblockRoomParticipant({ idOrSlug, participantRef, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room storage unavailable' };
  const room = await findRoom(idOrSlug);
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  if (!canManage(actorUserId, actorRole, room.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  const target = (room.blockedUserIds || []).find(
    (id) => blockedParticipantRef(room.roomId, id) === String(participantRef)
  );
  if (!target) return { valid: false, status: 404, error: 'Blocked participant not found' };
  room.blockedUserIds = room.blockedUserIds.filter((id) => String(id) !== String(target));
  await room.save();
  return { valid: true, status: 200 };
}

function moderationParticipantRef(sessionId, actorUserId) {
  return hashRoomInviteCode(`${sessionId}:${actorUserId}`).slice(0, 24);
}

async function listSessionParticipants({ sessionId, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  const ids = (session.participantUserIds || []).filter((id) => String(id) !== String(session.hostUserId));
  const characters = await MetaverseCharacter.find({ accountUserId: { $in: ids } })
    .select('accountUserId characterName archetype -_id')
    .lean();
  const byId = new Map(characters.map((character) => [String(character.accountUserId), character]));
  return {
    valid: true,
    status: 200,
    participants: ids.map((id) => ({
      ref: moderationParticipantRef(session.sessionId, id),
      characterName: byId.get(String(id))?.characterName || 'Verified participant',
      archetype: byId.get(String(id))?.archetype || 'explorer'
    }))
  };
}

async function moderateSessionParticipant({ sessionId, participantRef, actorUserId, actorRole, block = false }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Only live sessions can be moderated' };
  const target = (session.participantUserIds || []).find(
    (id) => String(id) !== String(session.hostUserId)
      && moderationParticipantRef(session.sessionId, id) === String(participantRef)
  );
  if (!target) return { valid: false, status: 404, error: 'Participant not found' };

  if (block) {
    await VirtualRoom.updateOne(
      { roomId: session.roomId },
      { $addToSet: { blockedUserIds: String(target) }, $pull: { allowedUserIds: String(target) } }
    );
  }
  session.participantUserIds = session.participantUserIds.filter((id) => String(id) !== String(target));
  session.stageRequestUserIds = (session.stageRequestUserIds || []).filter((id) => String(id) !== String(target));
  session.stageSpeakerUserIds = (session.stageSpeakerUserIds || []).filter((id) => String(id) !== String(target));
  session.lifecycleVersion += 1;
  await session.save();
  return { valid: true, status: 200, session: publicSession(session), action: block ? 'participant_blocked' : 'participant_removed' };
}

async function getStageStatus({ sessionId, actorUserId }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  const room = await findRoom(session.roomId);
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  const actor = String(actorUserId);
  if (!(session.participantUserIds || []).includes(actor) && actor !== String(session.hostUserId)) {
    return { valid: false, status: 403, error: 'Join session before accessing the stage' };
  }
  return {
    valid: true,
    status: 200,
    stage: {
      policy: room.stagePolicy,
      requested: (session.stageRequestUserIds || []).includes(actor),
      speaker: actor === String(session.hostUserId) || (session.stageSpeakerUserIds || []).includes(actor)
    }
  };
}

async function requestStageAccess({ sessionId, actorUserId }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Stage requests require a live session' };
  const room = await findRoom(session.roomId);
  if (!room || room.stagePolicy !== 'host-approved') return { valid: false, status: 409, error: 'This room does not accept stage requests' };
  const actor = String(actorUserId);
  if (!(session.participantUserIds || []).includes(actor)) return { valid: false, status: 403, error: 'Join session before requesting stage access' };
  if ((session.stageSpeakerUserIds || []).includes(actor)) {
    return { valid: true, status: 200, stage: { policy: room.stagePolicy, requested: false, speaker: true } };
  }
  session.stageRequestUserIds = Array.from(new Set([...(session.stageRequestUserIds || []), actor]));
  await session.save();
  return { valid: true, status: 200, stage: { policy: room.stagePolicy, requested: true, speaker: false } };
}

async function listStageRequests({ sessionId, actorUserId, actorRole }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  const ids = session.stageRequestUserIds || [];
  const characters = await MetaverseCharacter.find({ accountUserId: { $in: ids } }).select('accountUserId characterName archetype -_id').lean();
  const byId = new Map(characters.map((character) => [String(character.accountUserId), character]));
  return { valid: true, status: 200, requests: ids.map((id) => ({
    ref: moderationParticipantRef(session.sessionId, id),
    characterName: byId.get(String(id))?.characterName || 'Verified participant',
    archetype: byId.get(String(id))?.archetype || 'explorer'
  })) };
}

async function resolveStageRequest({ sessionId, participantRef, actorUserId, actorRole, approve }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (!canManage(actorUserId, actorRole, session.hostUserId)) return { valid: false, status: 403, error: 'Host capability required' };
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Only live sessions accept stage decisions' };
  const target = (session.stageRequestUserIds || []).find((id) => moderationParticipantRef(session.sessionId, id) === String(participantRef));
  if (!target) return { valid: false, status: 404, error: 'Stage request not found' };
  session.stageRequestUserIds = session.stageRequestUserIds.filter((id) => String(id) !== String(target));
  if (approve) session.stageSpeakerUserIds = Array.from(new Set([...(session.stageSpeakerUserIds || []), String(target)]));
  session.lifecycleVersion += 1;
  await session.save();
  return { valid: true, status: 200, session: publicSession(session), action: approve ? 'stage_approved' : 'stage_rejected' };
}

async function getSessionToken({ sessionId, actorUserId }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Session storage unavailable' };
  const session = await findSession(sessionId);
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  if (session.state !== 'live') return { valid: false, status: 409, error: 'Session is not live' };
  const actor = String(actorUserId);
  if (!(session.participantUserIds || []).includes(actor) && actor !== String(session.hostUserId)) return { valid: false, status: 403, error: 'Join session before requesting a token' };
  return { valid: true, status: 200, token: mintRealtimeToken(session, actor), sceneManifestVersion: session.sceneManifestVersion };
}

module.exports = {
  ROOM_TRANSITIONS,
  hashRoomInviteCode,
  publicInviteStatus,
  roomInviteRedemptionQuery,
  publicRoom,
  publicSession,
  createRoom,
  roomDiscoveryQuery,
  listDiscoverableRooms,
  findRoom,
  updateRoom,
  createRoomInvite,
  getRoomInviteStatus,
  revokeRoomInvite,
  redeemRoomInvite,
  createSession,
  findCurrentSessionForRoom,
  findSession,
  startSession,
  joinSession,
  leaveSession,
  endSession,
  blockedParticipantRef,
  listRoomBlockedParticipants,
  unblockRoomParticipant,
  moderationParticipantRef,
  listSessionParticipants,
  moderateSessionParticipant,
  getStageStatus,
  requestStageAccess,
  listStageRequests,
  resolveStageRequest,
  getSessionToken,
  validateJoin
};
