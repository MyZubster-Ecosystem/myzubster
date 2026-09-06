const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const VirtualRoom = require('../models/VirtualRoom');
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
  if (patch.accessPolicy) {
    if (!['public', 'authenticated', 'private'].includes(patch.accessPolicy)) return { valid: false, status: 400, error: 'Invalid access policy' };
    room.accessPolicy = patch.accessPolicy;
  }
  if (patch.capacity !== undefined) {
    const numericCapacity = Number(patch.capacity);
    if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 500) return { valid: false, status: 400, error: 'Capacity must be between 1 and 500' };
    room.capacity = numericCapacity;
  }
  if (patch.sceneManifestVersion) room.sceneManifestVersion = cleanText(patch.sceneManifestVersion, 40);
  if (patch.scheduledFor !== undefined) room.scheduledFor = patch.scheduledFor ? new Date(patch.scheduledFor) : null;
  if (Array.isArray(patch.allowedUserIds)) room.allowedUserIds = patch.allowedUserIds.map((id) => cleanText(id, 120)).filter(Boolean);
  if (Array.isArray(patch.blockedUserIds)) room.blockedUserIds = patch.blockedUserIds.map((id) => cleanText(id, 120)).filter(Boolean);

  await room.save();
  return { valid: true, status: 200, room: publicRoom(room) };
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
  publicRoom,
  publicSession,
  createRoom,
  findRoom,
  updateRoom,
  createSession,
  findSession,
  startSession,
  joinSession,
  leaveSession,
  endSession,
  getSessionToken,
  validateJoin
};
