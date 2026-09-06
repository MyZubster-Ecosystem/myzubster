const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const VirtualSession = require('../models/VirtualSession');

const TOKEN_TTL_SECONDS = 300;
const CHANNEL_RE = /^(user|community|session):([A-Za-z0-9._:-]{1,160})$/;

function tokenSecret() {
  const secret = process.env.REALTIME_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Realtime token secret is not configured');
  return secret;
}

function normalizeChannel(value) {
  const channel = String(value || '').trim();
  return CHANNEL_RE.test(channel) ? channel : null;
}

function mintSocketToken({ userId, role = 'user', username = null, correlationId = null }) {
  if (!userId) throw new Error('Authenticated user required');
  return jwt.sign({
    sub: String(userId),
    role: String(role || 'user'),
    username: username ? String(username).slice(0, 80) : undefined,
    purpose: 'myzubster-realtime',
    correlationId: correlationId || crypto.randomUUID()
  }, tokenSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: 'myzubster-backend',
    audience: 'myzubster-realtime'
  });
}

function verifySocketToken(token) {
  const decoded = jwt.verify(String(token || ''), tokenSecret(), {
    issuer: 'myzubster-backend',
    audience: 'myzubster-realtime'
  });
  if (decoded.purpose !== 'myzubster-realtime' || !decoded.sub) throw new Error('Invalid realtime token purpose');
  return {
    userId: String(decoded.sub),
    role: String(decoded.role || 'user'),
    username: decoded.username || null,
    correlationId: decoded.correlationId || null,
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
  };
}

async function authorizeChannel({ channel, userId, role = 'user' }) {
  const normalized = normalizeChannel(channel);
  if (!normalized) return { allowed: false, reason: 'invalid_channel' };

  const [kind, id] = normalized.split(':', 2);
  if (kind === 'user') {
    return String(id) === String(userId) || role === 'admin'
      ? { allowed: true, channel: normalized }
      : { allowed: false, reason: 'user_channel_forbidden' };
  }

  if (kind === 'community') {
    if (role === 'admin') return { allowed: true, channel: normalized };
    return { allowed: false, reason: 'community_membership_authority_unavailable' };
  }

  const session = await VirtualSession.findOne({ sessionId: id }).lean();
  if (!session) return { allowed: false, reason: 'session_not_found' };
  const actor = String(userId);
  const isParticipant = (session.participantUserIds || []).map(String).includes(actor);
  const isHost = String(session.hostUserId) === actor;
  if (role === 'admin' || isHost || isParticipant) return { allowed: true, channel: normalized };
  return { allowed: false, reason: 'session_channel_forbidden' };
}

module.exports = {
  TOKEN_TTL_SECONDS,
  normalizeChannel,
  mintSocketToken,
  verifySocketToken,
  authorizeChannel
};
