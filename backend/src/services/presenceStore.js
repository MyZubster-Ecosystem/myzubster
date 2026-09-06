const { createClient } = require('redis');

const DEFAULT_TTL_MS = 90 * 1000;
let redisClient = null;
let redisInit = null;
const localConnections = new Map();

function encodeChannel(channel) {
  return Buffer.from(String(channel)).toString('base64url');
}

function redisConfigured() {
  return Boolean(process.env.REDIS_URL);
}

async function getRedis() {
  if (!redisConfigured()) return null;
  if (redisClient?.isReady) return redisClient;
  if (!redisInit) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (error) => console.error('Presence Redis error:', error?.name || 'Error'));
    redisInit = redisClient.connect().then(() => redisClient).catch((error) => {
      redisInit = null;
      throw error;
    });
  }
  return redisInit;
}

function member(userId, connectionId) {
  return `${String(userId)}|${String(connectionId)}`;
}

function parseMember(value) {
  const index = value.indexOf('|');
  return index < 0 ? { userId: value, connectionId: '' } : { userId: value.slice(0, index), connectionId: value.slice(index + 1) };
}

function localPrune(now = Date.now()) {
  for (const [key, row] of localConnections.entries()) {
    if (row.expiresAt <= now) localConnections.delete(key);
  }
}

async function add({ channel, userId, connectionId, joinedAt = Date.now(), ttlMs = DEFAULT_TTL_MS }) {
  const client = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  if (!client) {
    localPrune();
    const existingForUser = [...localConnections.values()].some((row) => row.channel === channel && row.userId === String(userId));
    localConnections.set(`${channel}|${connectionId}`, { channel, userId: String(userId), connectionId: String(connectionId), joinedAt, expiresAt });
    return { firstConnection: !existingForUser, mode: 'local-fallback' };
  }

  const key = `presence:channel:${encodeChannel(channel)}`;
  const value = member(userId, connectionId);
  await client.zRemRangeByScore(key, 0, Date.now());
  const active = await client.zRangeByScore(key, Date.now() + 1, '+inf');
  const firstConnection = !active.some((entry) => parseMember(entry).userId === String(userId));
  const metadataKey = `presence:connection:${encodeChannel(channel)}:${connectionId}`;
  const multi = client.multi();
  multi.zAdd(key, [{ score: expiresAt, value }]);
  multi.pExpire(key, ttlMs * 2);
  multi.hSet(metadataKey, { userId: String(userId), joinedAt: String(joinedAt) });
  multi.pExpire(metadataKey, ttlMs);
  await multi.exec();
  return { firstConnection, mode: 'redis' };
}

async function touch({ channel, userId, connectionId, ttlMs = DEFAULT_TTL_MS }) {
  const client = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  if (!client) {
    localPrune();
    const row = localConnections.get(`${channel}|${connectionId}`);
    if (!row || row.userId !== String(userId)) return false;
    row.expiresAt = expiresAt;
    return true;
  }
  const key = `presence:channel:${encodeChannel(channel)}`;
  const value = member(userId, connectionId);
  const score = await client.zScore(key, value);
  if (score === null) return false;
  const metadataKey = `presence:connection:${encodeChannel(channel)}:${connectionId}`;
  const multi = client.multi();
  multi.zAdd(key, [{ score: expiresAt, value }]);
  multi.pExpire(key, ttlMs * 2);
  multi.pExpire(metadataKey, ttlMs);
  await multi.exec();
  return true;
}

async function remove({ channel, userId, connectionId }) {
  const client = await getRedis();
  if (!client) {
    localPrune();
    localConnections.delete(`${channel}|${connectionId}`);
    const stillPresent = [...localConnections.values()].some((row) => row.channel === channel && row.userId === String(userId));
    return { lastConnection: !stillPresent, mode: 'local-fallback' };
  }
  const key = `presence:channel:${encodeChannel(channel)}`;
  const metadataKey = `presence:connection:${encodeChannel(channel)}:${connectionId}`;
  const multi = client.multi();
  multi.zRem(key, member(userId, connectionId));
  multi.del(metadataKey);
  await multi.exec();
  await client.zRemRangeByScore(key, 0, Date.now());
  const active = await client.zRangeByScore(key, Date.now() + 1, '+inf');
  const stillPresent = active.some((entry) => parseMember(entry).userId === String(userId));
  return { lastConnection: !stillPresent, mode: 'redis' };
}

async function list(channel) {
  const client = await getRedis();
  if (!client) {
    localPrune();
    const byUser = new Map();
    for (const row of localConnections.values()) {
      if (row.channel !== channel) continue;
      const current = byUser.get(row.userId);
      if (!current || row.joinedAt < current.joinedAt) byUser.set(row.userId, row);
    }
    return { mode: 'local-fallback', members: [...byUser.values()].map((row) => ({ userId: row.userId, joinedAt: row.joinedAt })) };
  }
  const key = `presence:channel:${encodeChannel(channel)}`;
  await client.zRemRangeByScore(key, 0, Date.now());
  const active = await client.zRangeByScore(key, Date.now() + 1, '+inf');
  const byUser = new Map();
  for (const entry of active) {
    const { userId, connectionId } = parseMember(entry);
    const metadata = await client.hGetAll(`presence:connection:${encodeChannel(channel)}:${connectionId}`);
    const joinedAt = Number(metadata.joinedAt || Date.now());
    const current = byUser.get(userId);
    if (!current || joinedAt < current.joinedAt) byUser.set(userId, { userId, joinedAt });
  }
  return { mode: 'redis', members: [...byUser.values()] };
}

function mode() {
  return redisConfigured() ? 'redis' : 'local-fallback';
}

module.exports = { DEFAULT_TTL_MS, add, touch, remove, list, mode, redisConfigured };
