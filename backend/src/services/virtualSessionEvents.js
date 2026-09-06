const crypto = require('crypto');
const mongoose = require('mongoose');
const VirtualSessionEvent = require('../models/VirtualSessionEvent');

const EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENT_PAGE = 100;

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function publicEvent(value) {
  const event = typeof value?.toObject === 'function' ? value.toObject() : value;
  return {
    id: event.eventId,
    sessionId: event.sessionId,
    roomId: event.roomId,
    sequence: event.sequence,
    type: event.type,
    state: event.state,
    participantCount: event.participantCount,
    sceneManifestVersion: event.sceneManifestVersion,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt
  };
}

async function appendSessionEvent({ session, type }) {
  if (!databaseAvailable()) throw new Error('Session event storage unavailable');
  const snapshot = typeof session?.toObject === 'function' ? session.toObject() : session;
  if (!snapshot?.sessionId || !Number.isInteger(snapshot.lifecycleVersion)) {
    throw new Error('Invalid session event snapshot');
  }

  const event = await VirtualSessionEvent.create({
    eventId: crypto.randomUUID(),
    sessionId: snapshot.sessionId,
    roomId: snapshot.roomId,
    sequence: snapshot.lifecycleVersion,
    type,
    state: snapshot.state,
    participantCount: (snapshot.participantUserIds || []).length,
    sceneManifestVersion: snapshot.sceneManifestVersion || '1',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + EVENT_RETENTION_MS)
  });

  return publicEvent(event);
}

async function listSessionEvents({ sessionId, after = 0, limit = 50 }) {
  if (!databaseAvailable()) {
    return { status: 'unavailable', events: [], cursor: Number(after) || 0, retryRecommended: true };
  }

  const cursor = Math.max(0, Number.parseInt(after, 10) || 0);
  const pageSize = Math.min(MAX_EVENT_PAGE, Math.max(1, Number.parseInt(limit, 10) || 50));
  const rows = await VirtualSessionEvent.find({
    sessionId: String(sessionId),
    sequence: { $gt: cursor }
  })
    .sort({ sequence: 1 })
    .limit(pageSize)
    .lean();

  const events = rows.map(publicEvent);
  return {
    status: 'ok',
    events,
    cursor: events.length ? events[events.length - 1].sequence : cursor,
    retryRecommended: false,
    transport: 'persistent-polling',
    retentionSeconds: EVENT_RETENTION_MS / 1000
  };
}

module.exports = {
  EVENT_RETENTION_MS,
  appendSessionEvent,
  listSessionEvents,
  publicEvent
};
