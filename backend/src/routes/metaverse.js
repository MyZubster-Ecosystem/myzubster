const express = require('express');
const crypto = require('crypto');

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
    x: session.x,
    y: session.y,
    joinedAt: session.joinedAt
  };
}

function snapshot() {
  return Array.from(sessions.values()).map(publicPlayer);
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

router.get('/world', (_req, res) => {
  res.json({
    success: true,
    world: WORLD,
    online: sessions.size,
    players: snapshot(),
    identityMode: 'guest-unverified'
  });
});

router.post('/join', (req, res) => {
  if (sessions.size >= WORLD.capacity) {
    return res.status(503).json({ success: false, error: 'Neon Plaza is at capacity' });
  }

  const displayName = cleanText(req.body?.displayName, 30);
  const characterName = cleanText(req.body?.characterName, 30);
  const requestedArchetype = cleanText(req.body?.archetype, 20).toLowerCase();
  const archetype = ARCHETYPES.has(requestedArchetype) ? requestedArchetype : 'explorer';
  const myzId = cleanText(req.body?.myzId, 64) || null;

  if (displayName.length < 2 || characterName.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'displayName and characterName must contain at least 2 characters'
    });
  }

  const { x, y } = spawnPoint();
  const id = crypto.randomUUID();
  const session = {
    id,
    displayName,
    characterName,
    archetype,
    myzId,
    // v0.1 never upgrades a user-supplied MYZ-ID to verified.
    identityStatus: 'guest',
    x,
    y,
    joinedAt: new Date().toISOString()
  };

  sessions.set(id, session);
  broadcast({ type: 'join', player: publicPlayer(session), at: new Date().toISOString() });

  return res.status(201).json({
    success: true,
    sessionId: id,
    player: publicPlayer(session),
    players: snapshot(),
    world: WORLD,
    identityMode: 'guest-unverified',
    note: 'MYZ-ID values are display-only in v0.1 and are not treated as verified identity claims.'
  });
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
