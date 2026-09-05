const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const MetaverseCharacter = require('../models/MetaverseCharacter');
const MetaversePresence = require('../models/MetaversePresence');
const MetaverseChatMessage = require('../models/MetaverseChatMessage');
const { optionalAuthenticate } = require('../../../src/middleware/auth');

const router = express.Router();

const WORLD = {
  id: 'neon-plaza',
  name: 'MyZubster Neon Plaza',
  minX: 4,
  maxX: 96,
  minY: 8,
  maxY: 88,
  capacity: 250
};

// Historical floor for characters created before the public counter existed.
// This keeps the public total from incorrectly reporting zero during rollout.
const INITIAL_KNOWN_CHARACTER_COUNT = 1;
const PRESENCE_TTL_MS = 90 * 1000;
const CHAT_TTL_MS = 60 * 60 * 1000;
const SYNC_MESSAGE_LIMIT = 40;
const RECENT_CHAT_WINDOW_MS = 5 * 60 * 1000;
const SLOW_REQUEST_THRESHOLD_MS = 1500;
// Must remain comfortably longer than the browser polling interval so every
// active client has more than one opportunity to observe the emote.
const EMOTE_VISIBLE_MS = 5 * 1000;

const ARCHETYPES = new Set(['guardian', 'explorer', 'maker', 'chronicler', 'scientist']);
const EMOTES = new Set(['wave', 'spark', 'idea', 'leaf']);
const sessions = new Map();
const streams = new Map();
const cleanupTimers = new Map();
const actionTimes = new Map();
const recentMessages = [];

function cleanText(value, maxLength = 40) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
}

function clamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function spawnPoint() {
  const points = [
    [50, 68], [44, 72], [56, 72], [38, 64], [62, 64],
    [32, 74], [68, 74], [46, 58], [54, 58], [50, 78]
  ];
  const [x, y] = points[Math.floor(Math.random() * points.length)];
  return { x, y };
}

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function presenceExpiry(now = new Date()) {
  return new Date(now.getTime() + PRESENCE_TTL_MS);
}

function normalizeSession(value) {
  if (!value) return null;
  const session = typeof value.toObject === 'function' ? value.toObject() : value;
  return {
    ...session,
    id: session.id || session.sessionId,
    joinedAt: session.joinedAt instanceof Date ? session.joinedAt.toISOString() : session.joinedAt,
    lastSeenAt: session.lastSeenAt instanceof Date ? session.lastSeenAt.toISOString() : session.lastSeenAt,
    expiresAt: session.expiresAt instanceof Date ? session.expiresAt.toISOString() : session.expiresAt,
    emoteExpiresAt: session.emoteExpiresAt instanceof Date
      ? session.emoteExpiresAt.toISOString()
      : session.emoteExpiresAt
  };
}

function publicPlayer(value) {
  const session = normalizeSession(value);
  const emoteActive = session.emote
    && session.emoteExpiresAt
    && new Date(session.emoteExpiresAt).getTime() > Date.now();

  return {
    id: session.id,
    displayName: session.displayName,
    characterName: session.characterName,
    archetype: session.archetype,
    myzId: session.myzId,
    identityStatus: session.identityStatus,
    github: session.github?.login ? {
      login: session.github.login,
      profileUrl: session.github.profileUrl
    } : null,
    x: session.x,
    y: session.y,
    emote: emoteActive ? session.emote : null,
    joinedAt: session.joinedAt
  };
}

function localSnapshot() {
  return Array.from(sessions.values()).map(publicPlayer);
}

async function listActiveSessions() {
  if (!databaseAvailable()) return Array.from(sessions.values()).map(normalizeSession);

  const presences = await MetaversePresence.find({
    worldId: WORLD.id,
    expiresAt: { $gt: new Date() }
  })
    .sort({ joinedAt: 1 })
    .limit(WORLD.capacity)
    .lean();

  return presences.map(normalizeSession);
}

async function sharedSnapshot() {
  const activeSessions = await listActiveSessions();
  return activeSessions.map(publicPlayer);
}

async function findSession(sessionId) {
  const localSession = sessions.get(sessionId);
  if (localSession) return normalizeSession(localSession);
  if (!databaseAvailable()) return null;

  const presence = await MetaversePresence.findOne({
    sessionId,
    worldId: WORLD.id,
    expiresAt: { $gt: new Date() }
  }).lean();
  return normalizeSession(presence);
}

async function persistPresence(value) {
  const session = normalizeSession(value);
  const now = new Date();
  const lastSeenAt = session.lastSeenAt ? new Date(session.lastSeenAt) : now;
  const expiresAt = presenceExpiry(now);
  const storedSession = {
    ...session,
    lastSeenAt: lastSeenAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  sessions.set(session.id, storedSession);

  if (databaseAvailable()) {
    await MetaversePresence.findOneAndUpdate(
      { sessionId: session.id },
      {
        $set: {
          worldId: WORLD.id,
          displayName: session.displayName,
          characterName: session.characterName,
          archetype: session.archetype,
          myzId: session.myzId || null,
          identityStatus: session.identityStatus,
          accountUserId: session.accountUserId || null,
          github: session.github || null,
          x: session.x,
          y: session.y,
          emote: session.emote || null,
          emoteExpiresAt: session.emoteExpiresAt ? new Date(session.emoteExpiresAt) : null,
          joinedAt: new Date(session.joinedAt),
          lastSeenAt,
          expiresAt
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return storedSession;
}

async function totalCharacterCount() {
  if (!databaseAvailable()) return INITIAL_KNOWN_CHARACTER_COUNT;

  try {
    // A returning browser reuses its generated characterName, while each join
    // currently creates a fresh persistence row. Count unique character names
    // so reconnects do not inflate the public creation total.
    const characterNames = await MetaverseCharacter.distinct('characterName', { worldId: WORLD.id });
    return Math.max(INITIAL_KNOWN_CHARACTER_COUNT, characterNames.length);
  } catch (error) {
    console.error('Metaverse character counter error:', error);
    return INITIAL_KNOWN_CHARACTER_COUNT;
  }
}

function publicFeaturedCharacter(character) {
  return {
    displayName: character.displayName,
    characterName: character.characterName,
    archetype: character.archetype,
    identityStatus: character.identityStatus,
    worldId: character.worldId,
    github: character.github?.login ? {
      login: character.github.login,
      profileUrl: character.github.profileUrl
    } : null
  };
}

async function featuredCharacters() {
  if (!databaseAvailable()) return [];

  try {
    const characters = await MetaverseCharacter.find({
      worldId: WORLD.id,
      identityStatus: 'account-linked',
      'github.id': { $exists: true, $ne: '' }
    })
      .select('-_id displayName characterName archetype identityStatus worldId github.login github.profileUrl')
      .sort({ lastSeenAt: -1 })
      .limit(12)
      .lean();

    return characters.map(publicFeaturedCharacter);
  } catch (error) {
    console.error('Featured metaverse characters error:', error);
    return [];
  }
}

function sendEvent(response, payload) {
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(payload, exceptSessionId = null) {
  for (const [sessionId, response] of streams.entries()) {
    if (sessionId === exceptSessionId) continue;
    try {
      sendEvent(response, payload);
    } catch (_error) {
      streams.delete(sessionId);
    }
  }
}

function allowAction(sessionId, action, intervalMs) {
  const key = `${sessionId}:${action}`;
  const now = Date.now();
  const previous = actionTimes.get(key) || 0;
  if (now - previous < intervalMs) return false;
  actionTimes.set(key, now);
  return true;
}

function cancelCleanup(sessionId) {
  const timer = cleanupTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    cleanupTimers.delete(sessionId);
  }
}

function removeLocalSession(sessionId) {
  cancelCleanup(sessionId);
  const stream = streams.get(sessionId);
  if (stream) {
    try { stream.end(); } catch (_error) {}
    streams.delete(sessionId);
  }

  const removed = sessions.delete(sessionId);
  for (const key of actionTimes.keys()) {
    if (key.startsWith(`${sessionId}:`)) actionTimes.delete(key);
  }
  return removed;
}

async function removeSession(sessionId) {
  const removed = removeLocalSession(sessionId);
  if (databaseAvailable()) {
    const result = await MetaversePresence.deleteOne({ sessionId, worldId: WORLD.id });
    if (result.deletedCount > 0 || removed) {
      broadcast({ type: 'leave', sessionId, at: new Date().toISOString() });
    }
    return;
  }

  if (removed) broadcast({ type: 'leave', sessionId, at: new Date().toISOString() });
}

async function persistCharacter(session) {
  if (!databaseAvailable()) return 'ephemeral';

  await MetaverseCharacter.create({
    characterId: session.id,
    displayName: session.displayName,
    characterName: session.characterName,
    archetype: session.archetype,
    identityStatus: session.identityStatus,
    worldId: WORLD.id,
    createdFrom: 'public-web',
    lastSeenAt: new Date()
  });

  return 'durable';
}

async function linkedCharacterForUser(userId) {
  if (!userId) return null;
  if (!databaseAvailable()) {
    throw new Error('Character storage is temporarily unavailable');
  }

  return MetaverseCharacter.findOneAndUpdate(
    {
      accountUserId: userId,
      worldId: WORLD.id,
      identityStatus: 'account-linked'
    },
    { $set: { lastSeenAt: new Date() } },
    { new: true }
  );
}

function publicMessage(value) {
  const message = typeof value?.toObject === 'function' ? value.toObject() : value;
  return {
    id: message.messageId || message.id,
    sessionId: message.sessionId,
    characterName: message.characterName,
    text: message.text,
    at: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt || message.at
  };
}

async function persistMessage(message) {
  recentMessages.push(message);
  if (recentMessages.length > SYNC_MESSAGE_LIMIT) recentMessages.splice(0, recentMessages.length - SYNC_MESSAGE_LIMIT);
  if (!databaseAvailable()) return;

  await MetaverseChatMessage.create({
    messageId: message.id,
    worldId: WORLD.id,
    sessionId: message.sessionId,
    characterName: message.characterName,
    text: message.text,
    createdAt: new Date(message.at),
    expiresAt: new Date(Date.now() + CHAT_TTL_MS)
  });
}

function parseCursor(value) {
  if (!value) return null;
  const cursor = new Date(value);
  return Number.isNaN(cursor.getTime()) ? null : cursor;
}

async function messagesSince(cursorValue, observedAt) {
  const cursor = parseCursor(cursorValue);
  if (!databaseAvailable()) {
    return recentMessages
      .filter((message) => !cursor || new Date(message.at) > cursor)
      .slice(-SYNC_MESSAGE_LIMIT)
      .map(publicMessage);
  }

  const query = {
    worldId: WORLD.id,
    createdAt: cursor
      ? { $gt: cursor, $lte: observedAt }
      : { $lte: observedAt }
  };
  const sort = cursor ? { createdAt: 1 } : { createdAt: -1 };
  const messages = await MetaverseChatMessage.find(query)
    .sort(sort)
    .limit(SYNC_MESSAGE_LIMIT)
    .lean();

  if (!cursor) messages.reverse();
  return messages.map(publicMessage);
}

function requestDurationMs(startedAt) {
  return Number(process.hrtime.bigint() - startedAt) / 1e6;
}

function logRequestOutcome(req, res, startedAt) {
  const durationMs = requestDurationMs(startedAt);
  const slow = durationMs >= SLOW_REQUEST_THRESHOLD_MS;
  if (res.statusCode < 500 && !slow) return;

  // Intentionally exclude request bodies, query strings, chat content,
  // authorization headers, tokens and session identifiers from production logs.
  console.warn(JSON.stringify({
    event: 'metaverse_request',
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs: Math.round(durationMs),
    slow
  }));
}

async function healthSnapshot() {
  const checkedAt = new Date();
  if (!databaseAvailable() || !mongoose.connection.db) {
    return {
      success: false,
      status: 'degraded',
      worldId: WORLD.id,
      transport: 'unavailable',
      mongodb: 'disconnected',
      checkedAt: checkedAt.toISOString()
    };
  }

  const pingStartedAt = process.hrtime.bigint();
  await mongoose.connection.db.admin().ping();
  const mongodbPingMs = Math.round(requestDurationMs(pingStartedAt));
  const recentChatSince = new Date(checkedAt.getTime() - RECENT_CHAT_WINDOW_MS);

  const [activePlayers, recentChatMessages, latestPresence] = await Promise.all([
    MetaversePresence.countDocuments({
      worldId: WORLD.id,
      expiresAt: { $gt: checkedAt }
    }),
    MetaverseChatMessage.countDocuments({
      worldId: WORLD.id,
      createdAt: { $gte: recentChatSince, $lte: checkedAt }
    }),
    MetaversePresence.findOne({ worldId: WORLD.id })
      .sort({ lastSeenAt: -1 })
      .select('lastSeenAt -_id')
      .lean()
  ]);

  const latestHeartbeatAt = latestPresence?.lastSeenAt
    ? new Date(latestPresence.lastSeenAt)
    : null;
  const latestHeartbeatAgeMs = latestHeartbeatAt && !Number.isNaN(latestHeartbeatAt.getTime())
    ? Math.max(0, checkedAt.getTime() - latestHeartbeatAt.getTime())
    : null;

  return {
    success: true,
    status: 'healthy',
    worldId: WORLD.id,
    transport: 'shared-polling',
    mongodb: 'connected',
    mongodbPingMs,
    activePlayers,
    recentChatMessages,
    latestHeartbeatAgeMs,
    retention: {
      presenceSeconds: PRESENCE_TTL_MS / 1000,
      chatSeconds: CHAT_TTL_MS / 1000
    },
    checkedAt: checkedAt.toISOString()
  };
}

router.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Metaverse-Transport', databaseAvailable() ? 'shared-polling' : 'unavailable');
  res.once('finish', () => logRequestOutcome(req, res, startedAt));
  next();
});

router.get('/health', async (_req, res) => {
  try {
    const snapshot = await healthSnapshot();
    return res.status(snapshot.success ? 200 : 503).json(snapshot);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'metaverse_health_error',
      errorName: String(error?.name || 'Error').slice(0, 60),
      errorCode: String(error?.code || 'UNKNOWN').slice(0, 60)
    }));
    return res.status(503).json({
      success: false,
      status: 'degraded',
      worldId: WORLD.id,
      transport: databaseAvailable() ? 'shared-polling' : 'unavailable',
      mongodb: databaseAvailable() ? 'error' : 'disconnected',
      checkedAt: new Date().toISOString()
    });
  }
});

router.get('/world', async (_req, res) => {
  try {
    const [players, totalCharacters, verifiedCharacters] = await Promise.all([
      sharedSnapshot(),
      totalCharacterCount(),
      featuredCharacters()
    ]);

    return res.json({
      success: true,
      world: WORLD,
      online: players.length,
      totalCharacters,
      players,
      featuredCharacters: verifiedCharacters,
      identityMode: 'guest-unverified',
      transport: databaseAvailable() ? 'shared-polling' : 'ephemeral'
    });
  } catch (error) {
    console.error('Metaverse world snapshot error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
});

router.post('/join', optionalAuthenticate, async (req, res) => {
  let activeSessions;
  try {
    activeSessions = await listActiveSessions();
  } catch (error) {
    console.error('Metaverse capacity lookup error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
  if (activeSessions.length >= WORLD.capacity) {
    return res.status(503).json({ success: false, error: 'Neon Plaza is at capacity' });
  }

  let linkedCharacter = null;
  if (req.userId) {
    try {
      linkedCharacter = await linkedCharacterForUser(req.userId);
    } catch (error) {
      console.error('Metaverse linked identity lookup error:', error);
      return res.status(503).json({
        success: false,
        error: 'Verified character storage is temporarily unavailable'
      });
    }

    if (!linkedCharacter) {
      return res.status(409).json({
        success: false,
        error: 'No verified MyZubster character is linked to this account'
      });
    }
  }

  const requestedDisplayName = cleanText(req.body?.displayName, 30);
  const requestedCharacterName = cleanText(req.body?.characterName, 30);
  const requestedArchetype = cleanText(req.body?.archetype, 20).toLowerCase();
  const guestArchetype = ARCHETYPES.has(requestedArchetype) ? requestedArchetype : 'explorer';
  const requestedMyzId = cleanText(req.body?.myzId, 64) || null;

  if (!linkedCharacter && (requestedDisplayName.length < 2 || requestedCharacterName.length < 2)) {
    return res.status(400).json({
      success: false,
      error: 'displayName and characterName must contain at least 2 characters'
    });
  }

  const { x, y } = spawnPoint();
  const id = crypto.randomUUID();
  const now = new Date();
  const session = {
    id,
    displayName: linkedCharacter ? cleanText(linkedCharacter.displayName, 30) : requestedDisplayName,
    characterName: linkedCharacter ? cleanText(linkedCharacter.characterName, 30) : requestedCharacterName,
    archetype: linkedCharacter && ARCHETYPES.has(linkedCharacter.archetype)
      ? linkedCharacter.archetype
      : guestArchetype,
    myzId: linkedCharacter ? cleanText(linkedCharacter.characterId, 64) : requestedMyzId,
    identityStatus: linkedCharacter ? 'account-linked' : 'guest',
    accountUserId: linkedCharacter ? String(req.userId) : null,
    github: linkedCharacter?.github?.login ? {
      login: cleanText(linkedCharacter.github.login, 40),
      profileUrl: String(linkedCharacter.github.profileUrl || '').slice(0, 240)
    } : null,
    x,
    y,
    emote: null,
    emoteExpiresAt: null,
    joinedAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: presenceExpiry(now).toISOString()
  };

  try {
    const persistence = linkedCharacter ? 'linked-existing' : await persistCharacter(session);
    await persistPresence(session);
    const [players, totalCharacters] = await Promise.all([
      sharedSnapshot(),
      totalCharacterCount()
    ]);
    const identityMode = linkedCharacter ? 'account-linked' : 'guest-unverified';
    broadcast({ type: 'join', player: publicPlayer(session), at: new Date().toISOString() });

    return res.status(201).json({
      success: true,
      sessionId: id,
      player: publicPlayer(session),
      players,
      world: WORLD,
      totalCharacters,
      identityMode,
      persistence,
      transport: databaseAvailable() ? 'shared-polling' : 'ephemeral',
      note: linkedCharacter
        ? 'The authenticated account was linked to its existing verified MyZubster character.'
        : 'Client-supplied MYZ-ID values are display-only and are not treated as verified identity claims.'
    });
  } catch (error) {
    removeLocalSession(id);
    console.error('Metaverse character persistence error:', error);
    return res.status(503).json({
      success: false,
      error: 'Character storage is temporarily unavailable'
    });
  }
});

router.post('/sync', async (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  try {
    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });

    const now = new Date();
    session.lastSeenAt = now.toISOString();
    session.expiresAt = presenceExpiry(now).toISOString();
    await persistPresence(session);

    const observedAt = new Date();
    const [players, messages] = await Promise.all([
      sharedSnapshot(),
      messagesSince(req.body?.cursor, observedAt)
    ]);

    return res.json({
      success: true,
      world: WORLD,
      players,
      messages,
      online: players.length,
      cursor: observedAt.toISOString(),
      transport: databaseAvailable() ? 'shared-polling' : 'ephemeral'
    });
  } catch (error) {
    console.error('Metaverse sync error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse sync is temporarily unavailable' });
  }
});

// Kept for older clients. Current web clients use /sync because long-lived SSE
// streams are not reliable across stateless serverless instances.
router.get('/events', async (req, res) => {
  const sessionId = cleanText(req.query.sessionId, 64);
  let session;
  try {
    session = await findSession(sessionId);
  } catch (_error) {
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
  if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });

  cancelCleanup(sessionId);
  const previous = streams.get(sessionId);
  if (previous && previous !== res) {
    try { previous.end(); } catch (_error) {}
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  streams.set(sessionId, res);
  let players;
  try { players = await sharedSnapshot(); } catch (_error) { players = localSnapshot(); }
  sendEvent(res, { type: 'snapshot', world: WORLD, players, at: new Date().toISOString() });

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (_error) {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (streams.get(sessionId) === res) streams.delete(sessionId);

    // Allow a short reconnect window before removing presence for legacy clients.
    cancelCleanup(sessionId);
    cleanupTimers.set(sessionId, setTimeout(() => {
      removeSession(sessionId).catch(() => {});
    }, 30000));
  });
});

router.post('/move', async (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  try {
    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
    if (!allowAction(sessionId, 'move', 45)) return res.status(429).json({ success: false, error: 'Move rate exceeded' });

    session.x = clamp(req.body?.x, WORLD.minX, WORLD.maxX);
    session.y = clamp(req.body?.y, WORLD.minY, WORLD.maxY);
    session.lastSeenAt = new Date().toISOString();
    await persistPresence(session);

    const player = publicPlayer(session);
    broadcast({ type: 'move', player, at: new Date().toISOString() }, sessionId);
    return res.json({ success: true, player });
  } catch (error) {
    console.error('Metaverse move error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
});

router.post('/chat', async (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  try {
    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
    if (!allowAction(sessionId, 'chat', 700)) return res.status(429).json({ success: false, error: 'Chat rate exceeded' });

    const text = cleanText(req.body?.text, 280);
    if (!text) return res.status(400).json({ success: false, error: 'Message is empty' });

    const message = {
      id: crypto.randomUUID(),
      sessionId,
      characterName: session.characterName,
      text,
      at: new Date().toISOString()
    };
    session.lastSeenAt = message.at;
    await Promise.all([persistPresence(session), persistMessage(message)]);

    broadcast({ type: 'chat', message });
    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Metaverse chat error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse chat is temporarily unavailable' });
  }
});

router.post('/emote', async (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  try {
    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
    if (!allowAction(sessionId, 'emote', 500)) return res.status(429).json({ success: false, error: 'Emote rate exceeded' });

    const emote = cleanText(req.body?.emote, 16).toLowerCase();
    if (!EMOTES.has(emote)) return res.status(400).json({ success: false, error: 'Unsupported emote' });

    const now = new Date();
    session.emote = emote;
    session.emoteExpiresAt = new Date(now.getTime() + EMOTE_VISIBLE_MS).toISOString();
    session.lastSeenAt = now.toISOString();
    await persistPresence(session);

    broadcast({ type: 'emote', sessionId, emote, at: now.toISOString() });
    return res.json({ success: true, emote });
  } catch (error) {
    console.error('Metaverse emote error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
});

router.post('/leave', async (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  try {
    await removeSession(sessionId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Metaverse leave error:', error);
    return res.status(503).json({ success: false, error: 'Metaverse presence is temporarily unavailable' });
  }
});

module.exports = router;
