const { deliveryDecision } = require('./realtimeModeration');
const presenceStore = require('./presenceStore');

const STALE_AFTER_MS = presenceStore.DEFAULT_TTL_MS;

function publicMembership(row) {
  return { userId: String(row.userId), joinedAt: new Date(Number(row.joinedAt)).toISOString() };
}

async function joinPresence({ channel, userId, connectionId, at = Date.now() }) {
  const result = await presenceStore.add({ channel, userId, connectionId, joinedAt: at, ttlMs: STALE_AFTER_MS });
  return { firstConnection: result.firstConnection, mode: result.mode, membership: publicMembership({ userId, joinedAt: at }) };
}

async function touchPresence({ channel, userId, connectionId }) {
  return presenceStore.touch({ channel, userId, connectionId, ttlMs: STALE_AFTER_MS });
}

async function leavePresence({ channel, userId, connectionId, joinedAt = Date.now() }) {
  const result = await presenceStore.remove({ channel, userId, connectionId });
  return { lastConnection: result.lastConnection, mode: result.mode, membership: publicMembership({ userId, joinedAt }) };
}

async function visibleMembers({ channel, viewerUserId }) {
  const snapshot = await presenceStore.list(channel);
  const visible = [];
  for (const row of snapshot.members) {
    if (String(row.userId) === String(viewerUserId)) {
      visible.push(publicMembership(row));
      continue;
    }
    const decision = await deliveryDecision({ senderUserId: row.userId, recipientUserId: viewerUserId });
    if (decision.allowed) visible.push(publicMembership(row));
  }
  return { mode: snapshot.mode, members: visible };
}

module.exports = {
  STALE_AFTER_MS,
  joinPresence,
  touchPresence,
  leavePresence,
  visibleMembers,
  presenceMode: presenceStore.mode
};
