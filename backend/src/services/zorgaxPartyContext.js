const crypto = require('crypto');
const mongoose = require('mongoose');
const MetaversePresence = require('../models/MetaversePresence');

const PARTY_CONTEXT_VERSION = '1.0';
const PARTY_CONTEXT_TTL_MS = 60 * 1000;

const NEON_PLAZA_ROOM = Object.freeze({
  id: 'neon-plaza',
  slug: 'neon-plaza',
  name: 'MyZubster Neon Plaza',
  kind: 'social-space',
  visibility: 'public'
});

const PUBLIC_COMMUNITY = Object.freeze({
  id: 'myzubster-metaverse',
  slug: 'myzubster-metaverse',
  name: 'MyZubster Metaverse',
  visibility: 'public'
});

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function safeString(value, maxLength = 120) {
  if (value === null || value === undefined) return null;
  const normalized = String(value)
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
  return normalized || null;
}

function contextIdFor(roomId, sessionId) {
  return crypto
    .createHash('sha256')
    .update(`${PARTY_CONTEXT_VERSION}:${roomId}:${sessionId || 'public'}`)
    .digest('hex')
    .slice(0, 24);
}

function publicActor(user) {
  if (!user?._id) {
    return {
      authenticated: false,
      identityStatus: 'guest-unverified',
      userId: null,
      roles: []
    };
  }

  return {
    authenticated: true,
    identityStatus: 'account-linked',
    userId: String(user._id),
    roles: Array.isArray(user.roles)
      ? user.roles.map((role) => safeString(role, 40)).filter(Boolean)
      : []
  };
}

async function resolveSessionSummary(sessionId) {
  if (!sessionId) return null;
  const normalizedSessionId = safeString(sessionId, 128);
  if (!normalizedSessionId) return null;

  if (!databaseAvailable()) {
    return {
      id: normalizedSessionId,
      state: 'unknown',
      live: false,
      participantCount: null,
      source: 'unavailable'
    };
  }

  const now = new Date();
  const presence = await MetaversePresence.findOne({
    sessionId: normalizedSessionId,
    worldId: NEON_PLAZA_ROOM.id,
    expiresAt: { $gt: now }
  })
    .select('sessionId worldId expiresAt -_id')
    .lean();

  if (!presence) return null;

  const participantCount = await MetaversePresence.countDocuments({
    worldId: NEON_PLAZA_ROOM.id,
    expiresAt: { $gt: now }
  });

  return {
    id: normalizedSessionId,
    state: 'live',
    live: true,
    participantCount,
    source: 'metaverse-presence'
  };
}

function capabilitiesFor({ actor, session }) {
  const capabilities = [
    'party.read_context',
    'party.read_community',
    'party.read_room'
  ];

  if (session?.live) capabilities.push('party.read_live_status');
  if (actor.authenticated) capabilities.push('party.use_account_context');

  return capabilities;
}

async function buildPartyContext({ user = null, sessionId = null } = {}) {
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + PARTY_CONTEXT_TTL_MS);
  const actor = publicActor(user);
  const session = await resolveSessionSummary(sessionId);

  const context = {
    id: contextIdFor(NEON_PLAZA_ROOM.id, session?.id || null),
    version: PARTY_CONTEXT_VERSION,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    scope: 'public-party-context',
    actor,
    community: { ...PUBLIC_COMMUNITY },
    event: null,
    room: { ...NEON_PLAZA_ROOM },
    session,
    capabilities: capabilitiesFor({ actor, session }),
    restrictions: {
      concealedLocations: false,
      covertLogistics: false,
      financialActions: false,
      physicalSystemCommands: false,
      autonomousHighImpactModeration: false
    }
  };

  return context;
}

function validatePartyContext(context) {
  const errors = [];
  if (!context || typeof context !== 'object') errors.push('context must be an object');
  if (context?.version !== PARTY_CONTEXT_VERSION) errors.push('unsupported context version');
  if (!context?.room?.id) errors.push('room.id is required');
  if (!context?.community?.id) errors.push('community.id is required');
  if (!Array.isArray(context?.capabilities)) errors.push('capabilities must be an array');
  if (!context?.expiresAt || Number.isNaN(new Date(context.expiresAt).getTime())) {
    errors.push('expiresAt must be an ISO date');
  }

  const serialized = JSON.stringify(context || {}).toLowerCase();
  const forbiddenKeys = [
    'authorization',
    'token',
    'email',
    'ipaddress',
    'privatekey',
    'precisecoordinates',
    'hiddenlocation',
    'secretlocation'
  ];
  for (const key of forbiddenKeys) {
    if (serialized.includes(`\"${key}\"`)) errors.push(`forbidden field: ${key}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  PARTY_CONTEXT_VERSION,
  PARTY_CONTEXT_TTL_MS,
  buildPartyContext,
  validatePartyContext
};
