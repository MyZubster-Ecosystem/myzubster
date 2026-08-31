const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const MetaverseCharacter = require('../models/MetaverseCharacter');
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

const ARCHETYPES = new Set(['guardian', 'explorer', 'maker', 'chronicler', 'scientist']);
const EMOTES = new Set(['wave', 'spark', 'idea', 'leaf']);
const sessions = new Map();
const streams = new Map();
const cleanupTimers = new Map();
const actionTimes = new Map();

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

function publicPlayer(session) {
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
    joinedAt: session.joinedAt
  };
}

function snapshot() {
  return Array.from(sessions.values()).map(publicPlayer);
}

async function totalCharacterCount() {
  if (mongoose.connection.readyState !== 1) return INITIAL_KNOWN_CHARACTER_COUNT;

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
  if (mongoose.connection.readyState !== 1) return [];

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

function removeSession(sessionId) {
  cancelCleanup(sessionId);
  const stream = streams.get(sessionId);
  if (stream) {
    try { stream.end(); } catch (_error) {}
    streams.delete(sessionId);
  }

  if (sessions.delete(sessionId)) {
    broadcast({ type: 'leave', sessionId, at: new Date().toISOString() });
  }
}

async function persistCharacter(session) {
  if (mongoose.connection.readyState !== 1) return 'ephemeral';

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
  if (mongoose.connection.readyState !== 1) {
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

router.get('/world', async (_req, res) => {
  const [totalCharacters, verifiedCharacters] = await Promise.all([
    totalCharacterCount(),
    featuredCharacters()
  ]);

  res.json({
    success: true,
    world: WORLD,
    online: sessions.size,
    totalCharacters,
    players: snapshot(),
    featuredCharacters: verifiedCharacters,
    identityMode: 'guest-unverified'
  });
});

router.post('/join', optionalAuthenticate, async (req, res) => {
  if (sessions.size >= WORLD.capacity) {
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
    joinedAt: new Date().toISOString()
  };

  try {
    const persistence = linkedCharacter ? 'linked-existing' : await persistCharacter(session);
    const totalCharacters = await totalCharacterCount();
    const identityMode = linkedCharacter ? 'account-linked' : 'guest-unverified';
    sessions.set(id, session);
    broadcast({ type: 'join', player: publicPlayer(session), at: new Date().toISOString() });

    return res.status(201).json({
      success: true,
      sessionId: id,
      player: publicPlayer(session),
      players: snapshot(),
      world: WORLD,
      totalCharacters,
      identityMode,
      persistence,
      note: linkedCharacter
        ? 'The authenticated account was linked to its existing verified MyZubster character.'
        : 'Client-supplied MYZ-ID values are display-only and are not treated as verified identity claims.'
    });
  } catch (error) {
    console.error('Metaverse character persistence error:', error);
    return res.status(503).json({
      success: false,
      error: 'Character storage is temporarily unavailable'
    });
  }
});

router.get('/events', (req, res) => {
  const sessionId = cleanText(req.query.sessionId, 64);
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
  }

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
  sendEvent(res, {
    type: 'snapshot',
    world: WORLD,
    players: snapshot(),
    at: new Date().toISOString()
  });

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

    // Allow a short reconnect window before removing presence.
    cancelCleanup(sessionId);
    cleanupTimers.set(sessionId, setTimeout(() => removeSession(sessionId), 30000));
  });
});

router.post('/move', (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
  if (!allowAction(sessionId, 'move', 45)) return res.status(429).json({ success: false, error: 'Move rate exceeded' });

  session.x = clamp(req.body?.x, WORLD.minX, WORLD.maxX);
  session.y = clamp(req.body?.y, WORLD.minY, WORLD.maxY);

  const player = publicPlayer(session);
  broadcast({ type: 'move', player, at: new Date().toISOString() }, sessionId);
  return res.json({ success: true, player });
});

router.post('/chat', (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  const session = sessions.get(sessionId);
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

  broadcast({ type: 'chat', message });
  return res.status(201).json({ success: true, message });
});

router.post('/emote', (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ success: false, error: 'Unknown metaverse session' });
  if (!allowAction(sessionId, 'emote', 500)) return res.status(429).json({ success: false, error: 'Emote rate exceeded' });

  const emote = cleanText(req.body?.emote, 16).toLowerCase();
  if (!EMOTES.has(emote)) return res.status(400).json({ success: false, error: 'Unsupported emote' });

  broadcast({ type: 'emote', sessionId, emote, at: new Date().toISOString() });
  return res.json({ success: true, emote });
});

router.post('/leave', (req, res) => {
  const sessionId = cleanText(req.body?.sessionId, 64);
  removeSession(sessionId);
  return res.json({ success: true });
});

module.exports = router;

