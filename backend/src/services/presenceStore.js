const { createClient } = require("redis");
const {
  incrementCounter,
  logRealtimeEvent,
} = require("./realtimeObservability");

const DEFAULT_TTL_MS = 90 * 1000;
let redisClient = null;
let redisInit = null;
const localConnections = new Map();

function encodeChannel(channel) {
  return Buffer.from(String(channel)).toString("base64url");
}

function redisConfigured() {
  return Boolean(process.env.REDIS_URL);
}

function noteRedisFailure(operation, error) {
  incrementCounter("redisFailures");
  logRealtimeEvent(
    "redis_presence_failure",
    {
      operation,
      status: "local_fallback",
      reason: error?.name || "redis_error",
      mode: "local-fallback",
    },
    "warn",
  );
}

function invalidateRedisClient(client) {
  if (!client || client !== redisClient) return;
  const staleClient = redisClient;
  redisClient = null;
  redisInit = null;
  if (staleClient.isOpen) staleClient.disconnect().catch(() => {});
}

async function getRedis() {
  if (!redisConfigured()) return null;
  if (redisClient?.isReady) return redisClient;
  if (!redisInit) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (error) => noteRedisFailure("client", error));
    redisInit = redisClient
      .connect()
      .then(() => redisClient)
      .catch((error) => {
        redisInit = null;
        redisClient = null;
        noteRedisFailure("connect", error);
        return null;
      });
  }
  return redisInit;
}

function member(userId, connectionId) {
  return `${String(userId)}|${String(connectionId)}`;
}

function parseMember(value) {
  const index = value.indexOf("|");
  return index < 0
    ? { userId: value, connectionId: "" }
    : { userId: value.slice(0, index), connectionId: value.slice(index + 1) };
}

function localPrune(now = Date.now()) {
  for (const [key, row] of localConnections.entries()) {
    if (row.expiresAt <= now) localConnections.delete(key);
  }
}

function localAdd({
  channel,
  userId,
  connectionId,
  joinedAt = Date.now(),
  ttlMs = DEFAULT_TTL_MS,
}) {
  localPrune();
  const existingForUser = [...localConnections.values()].some(
    (row) => row.channel === channel && row.userId === String(userId),
  );
  localConnections.set(`${channel}|${connectionId}`, {
    channel,
    userId: String(userId),
    connectionId: String(connectionId),
    joinedAt,
    expiresAt: Date.now() + ttlMs,
  });
  return { firstConnection: !existingForUser, mode: "local-fallback" };
}

function localTouch({ channel, userId, connectionId, ttlMs = DEFAULT_TTL_MS }) {
  localPrune();
  const row = localConnections.get(`${channel}|${connectionId}`);
  if (!row || row.userId !== String(userId)) return false;
  row.expiresAt = Date.now() + ttlMs;
  return true;
}

function localRemove({ channel, userId, connectionId }) {
  localPrune();
  localConnections.delete(`${channel}|${connectionId}`);
  const stillPresent = [...localConnections.values()].some(
    (row) => row.channel === channel && row.userId === String(userId),
  );
  return { lastConnection: !stillPresent, mode: "local-fallback" };
}

function localList(channel) {
  localPrune();
  const byUser = new Map();
  for (const row of localConnections.values()) {
    if (row.channel !== channel) continue;
    const current = byUser.get(row.userId);
    if (!current || row.joinedAt < current.joinedAt)
      byUser.set(row.userId, row);
  }
  return {
    mode: "local-fallback",
    members: [...byUser.values()].map((row) => ({
      userId: row.userId,
      joinedAt: row.joinedAt,
    })),
  };
}

async function add({
  channel,
  userId,
  connectionId,
  joinedAt = Date.now(),
  ttlMs = DEFAULT_TTL_MS,
}) {
  const client = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  if (!client)
    return localAdd({ channel, userId, connectionId, joinedAt, ttlMs });

  try {
    const key = `presence:channel:${encodeChannel(channel)}`;
    const value = member(userId, connectionId);
    await client.zRemRangeByScore(key, 0, Date.now());
    const active = await client.zRangeByScore(key, Date.now() + 1, "+inf");
    const firstConnection = !active.some(
      (entry) => parseMember(entry).userId === String(userId),
    );
    const metadataKey = `presence:connection:${encodeChannel(channel)}:${connectionId}`;
    const multi = client.multi();
    multi.zAdd(key, [{ score: expiresAt, value }]);
    multi.pExpire(key, ttlMs * 2);
    multi.hSet(metadataKey, {
      userId: String(userId),
      joinedAt: String(joinedAt),
    });
    multi.pExpire(metadataKey, ttlMs);
    await multi.exec();
    return { firstConnection, mode: "redis" };
  } catch (error) {
    noteRedisFailure("add", error);
    invalidateRedisClient(client);
    return localAdd({ channel, userId, connectionId, joinedAt, ttlMs });
  }
}

async function touch({
  channel,
  userId,
  connectionId,
  ttlMs = DEFAULT_TTL_MS,
}) {
  const client = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  if (!client) return localTouch({ channel, userId, connectionId, ttlMs });
  try {
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
  } catch (error) {
    noteRedisFailure("touch", error);
    invalidateRedisClient(client);
    return localTouch({ channel, userId, connectionId, ttlMs });
  }
}

async function remove({ channel, userId, connectionId }) {
  const client = await getRedis();
  if (!client) return localRemove({ channel, userId, connectionId });
  try {
    const key = `presence:channel:${encodeChannel(channel)}`;
    const metadataKey = `presence:connection:${encodeChannel(channel)}:${connectionId}`;
    const multi = client.multi();
    multi.zRem(key, member(userId, connectionId));
    multi.del(metadataKey);
    await multi.exec();
    await client.zRemRangeByScore(key, 0, Date.now());
    const active = await client.zRangeByScore(key, Date.now() + 1, "+inf");
    const stillPresent = active.some(
      (entry) => parseMember(entry).userId === String(userId),
    );
    return { lastConnection: !stillPresent, mode: "redis" };
  } catch (error) {
    noteRedisFailure("remove", error);
    invalidateRedisClient(client);
    return localRemove({ channel, userId, connectionId });
  }
}

async function list(channel) {
  const client = await getRedis();
  if (!client) return localList(channel);
  try {
    const key = `presence:channel:${encodeChannel(channel)}`;
    await client.zRemRangeByScore(key, 0, Date.now());
    const active = await client.zRangeByScore(key, Date.now() + 1, "+inf");
    const byUser = new Map();
    for (const entry of active) {
      const { userId, connectionId } = parseMember(entry);
      const metadata = await client.hGetAll(
        `presence:connection:${encodeChannel(channel)}:${connectionId}`,
      );
      const joinedAt = Number(metadata.joinedAt || Date.now());
      const current = byUser.get(userId);
      if (!current || joinedAt < current.joinedAt)
        byUser.set(userId, { userId, joinedAt });
    }
    return { mode: "redis", members: [...byUser.values()] };
  } catch (error) {
    noteRedisFailure("list", error);
    invalidateRedisClient(client);
    return localList(channel);
  }
}

function mode() {
  return redisClient?.isReady ? "redis" : "local-fallback";
}

function resetPresenceStoreForTests() {
  if (redisClient?.isOpen) redisClient.disconnect().catch(() => {});
  redisClient = null;
  redisInit = null;
  localConnections.clear();
}

module.exports = {
  DEFAULT_TTL_MS,
  add,
  touch,
  remove,
  list,
  mode,
  redisConfigured,
  resetPresenceStoreForTests,
};
