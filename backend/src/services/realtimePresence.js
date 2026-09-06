const { deliveryDecision } = require('./realtimeModeration');

const STALE_AFTER_MS = 90 * 1000;
const memberships = new Map();

function key(channel, userId) {
  return `${channel}:${userId}`;
}

function nowMs() {
  return Date.now();
}

function prune(now = nowMs()) {
  for (const [membershipKey, row] of memberships.entries()) {
    for (const [connectionId, seenAt] of row.connections.entries()) {
      if (now - seenAt > STALE_AFTER_MS) row.connections.delete(connectionId);
    }
    if (!row.connections.size) memberships.delete(membershipKey);
  }
}

function joinPresence({ channel, userId, connectionId, at = nowMs() }) {
  prune(at);
  const membershipKey = key(channel, userId);
  let row = memberships.get(membershipKey);
  const firstConnection = !row;
  if (!row) {
    row = { channel, userId: String(userId), joinedAt: at, connections: new Map() };
    memberships.set(membershipKey, row);
  }
  row.connections.set(connectionId, at);
  return { firstConnection, membership: publicMembership(row) };
}

function touchPresence({ channel, userId, connectionId, at = nowMs() }) {
  const row = memberships.get(key(channel, userId));
  if (!row || !row.connections.has(connectionId)) return false;
  row.connections.set(connectionId, at);
  return true;
}

function leavePresence({ channel, userId, connectionId }) {
  const membershipKey = key(channel, userId);
  const row = memberships.get(membershipKey);
  if (!row) return { lastConnection: false, membership: null };
  row.connections.delete(connectionId);
  if (row.connections.size) return { lastConnection: false, membership: publicMembership(row) };
  memberships.delete(membershipKey);
  return { lastConnection: true, membership: publicMembership(row) };
}

function leaveConnection(connectionId) {
  const departed = [];
  for (const [membershipKey, row] of memberships.entries()) {
    if (!row.connections.delete(connectionId)) continue;
    if (!row.connections.size) {
      memberships.delete(membershipKey);
      departed.push(publicMembership(row));
    }
  }
  return departed;
}

function publicMembership(row) {
  return { userId: row.userId, joinedAt: new Date(row.joinedAt).toISOString() };
}

async function visibleMembers({ channel, viewerUserId }) {
  prune();
  const rows = [...memberships.values()].filter((row) => row.channel === channel);
  const visible = [];
  for (const row of rows) {
    if (String(row.userId) === String(viewerUserId)) {
      visible.push(publicMembership(row));
      continue;
    }
    const decision = await deliveryDecision({ senderUserId: row.userId, recipientUserId: viewerUserId });
    if (decision.allowed) visible.push(publicMembership(row));
  }
  return visible;
}

module.exports = {
  STALE_AFTER_MS,
  joinPresence,
  touchPresence,
  leavePresence,
  leaveConnection,
  visibleMembers,
  prune
};
