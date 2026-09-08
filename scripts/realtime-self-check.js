const assert = require("assert/strict");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { io: createClient } = require("socket.io-client");

function connectClient(url, token) {
  return new Promise((resolve, reject) => {
    const socket = createClient(url, {
      path: "/realtime",
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      timeout: 5000,
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("connection timeout"));
    }, 6000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${event} acknowledgement timeout`)),
      6000,
    );
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

async function verifyBackpressure(observability) {
  observability.resetRealtimeObservability();
  const gate = observability.createBackpressureGate({
    maxConcurrent: 1,
    maxQueued: 1,
  });
  let release;
  const first = gate.run(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const second = gate.run(async () => "second");
  await assert.rejects(
    gate.run(async () => "third"),
    observability.RealtimeBackpressureError,
  );
  release("first");
  assert.equal(await first, "first");
  assert.equal(await second, "second");
  const snapshot = observability.realtimeMetricsSnapshot();
  assert.equal(snapshot.counters.backpressureQueued, 1);
  assert.equal(snapshot.counters.backpressureRejected, 1);
}

async function verifyRedisFallback(observability) {
  const redis = require("redis");
  const originalCreateClient = redis.createClient;
  const originalRedisUrl = process.env.REDIS_URL;
  redis.createClient = () => ({
    isReady: false,
    isOpen: false,
    on() {},
    connect: async () => {
      throw new Error("synthetic Redis interruption");
    },
  });
  process.env.REDIS_URL = "redis://synthetic-unavailable:6379";
  const storePath = require.resolve("../backend/src/services/presenceStore");
  delete require.cache[storePath];
  const store = require(storePath);
  observability.resetRealtimeObservability();
  const result = await store.add({
    channel: "session:self-check",
    userId: "test-user",
    connectionId: "test-socket",
  });
  assert.equal(result.mode, "local-fallback");
  assert.equal(result.firstConnection, true);
  assert.equal(
    observability.realtimeMetricsSnapshot().counters.redisFailures,
    1,
  );
  store.resetPresenceStoreForTests();
  redis.createClient = originalCreateClient;
  if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = originalRedisUrl;
  delete require.cache[storePath];
}

async function verifyMetricsAccess(observability) {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "self-check-admin-secret";
  const router = require("../backend/src/routes/realtime");
  const app = express();
  app.use(express.json());
  app.use("/api/realtime", router);
  observability.resetRealtimeObservability();
  observability.incrementCounter("connectionAttempts", 2);
  observability.incrementCounter("connectionSuccesses", 2);

  const adminToken = jwt.sign(
    { userId: "self-check-admin", role: "admin" },
    process.env.JWT_SECRET,
  );
  const adminResponse = await request(app)
    .get("/api/realtime/metrics")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(adminResponse.status, 200);
  assert.equal(adminResponse.headers["cache-control"], "no-store");
  assert.equal(adminResponse.body.privacy, "aggregate-only");
  assert.equal(adminResponse.body.counters.connectionSuccesses, 2);
  assert.equal(
    JSON.stringify(adminResponse.body).includes("self-check-admin"),
    false,
  );

  const userToken = jwt.sign(
    { userId: "self-check-user", role: "user" },
    process.env.JWT_SECRET,
  );
  const userResponse = await request(app)
    .get("/api/realtime/metrics")
    .set("Authorization", `Bearer ${userToken}`);
  assert.equal(userResponse.status, 403);

  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
}

async function verifyDurableDelivery(observability) {
  const mongoose = require("mongoose");
  const Notification = require("../backend/src/models/Notification");
  const NotificationPreference = require("../backend/src/models/NotificationPreference");
  const ChatChannel = require("../backend/src/models/ChatChannel");
  const ChatMessage = require("../backend/src/models/ChatMessage");
  const realtimeHub = require("../backend/src/realtime/realtimeHub");
  const realtimeModeration = require("../backend/src/services/realtimeModeration");
  const notificationService = require("../backend/src/services/notificationService");
  const readyStateDescriptor = Object.getOwnPropertyDescriptor(
    mongoose.connection,
    "readyState",
  );
  const originals = {
    notificationFindOne: Notification.findOne,
    notificationCreate: Notification.create,
    preferenceFindOne: NotificationPreference.findOne,
    chatChannelFindOne: ChatChannel.findOne,
    chatMessageFindOne: ChatMessage.findOne,
    chatMessageCount: ChatMessage.countDocuments,
    chatMessageCreate: ChatMessage.create,
    deliveryDecision: realtimeModeration.deliveryDecision,
    createNotification: notificationService.createNotification,
  };

  try {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: 1,
    });
    realtimeHub.registerRealtimeIO(null);
    NotificationPreference.findOne = () => ({ lean: async () => null });
    Notification.findOne = () => ({ lean: async () => null });
    Notification.create = async (value) => ({
      ...value,
      createdAt: new Date(),
      readAt: null,
      toObject() {
        return { ...this };
      },
    });
    observability.resetRealtimeObservability();
    const notification = await notificationService.createNotification({
      userId: "recipient",
      type: "message",
      category: "message",
      dedupeKey: "message:self-check",
      payload: { messageId: "self-check-message" },
      deepLink: "/messages/self-check",
    });
    assert.equal(notification.valid, true);
    assert.equal(notification.realtimeEmitted, false);
    assert.equal(
      observability.realtimeMetricsSnapshot().counters.notificationsPersisted,
      1,
    );

    ChatChannel.findOne = () => ({
      lean: async () => ({
        channelId: "direct-self-check",
        type: "direct",
        participantUserIds: ["sender", "recipient"],
      }),
    });
    ChatMessage.findOne = () => ({ lean: async () => null });
    ChatMessage.countDocuments = async () => 0;
    ChatMessage.create = async () => ({
      toObject: () => ({
        messageId: "durable-self-check-message",
        clientMessageId: "durable-client-id",
        channelId: "direct-self-check",
        senderUserId: "sender",
        body: "durable body",
        createdAt: new Date(),
      }),
    });
    realtimeModeration.deliveryDecision = async () => ({ allowed: true });
    notificationService.createNotification = async () => {
      throw new Error("synthetic notification worker restart");
    };
    const chatPath = require.resolve("../backend/src/services/chatMessaging");
    delete require.cache[chatPath];
    const chat = require(chatPath);
    const message = await chat.persistMessage({
      actorUserId: "sender",
      channelId: "direct-self-check",
      clientMessageId: "durable-client-id",
      body: "durable body",
    });
    assert.equal(message.valid, true);
    assert.equal(message.message.messageId, "durable-self-check-message");
    assert.equal(message.notificationSummary.failed, 1);
    delete require.cache[chatPath];
  } finally {
    Notification.findOne = originals.notificationFindOne;
    Notification.create = originals.notificationCreate;
    NotificationPreference.findOne = originals.preferenceFindOne;
    ChatChannel.findOne = originals.chatChannelFindOne;
    ChatMessage.findOne = originals.chatMessageFindOne;
    ChatMessage.countDocuments = originals.chatMessageCount;
    ChatMessage.create = originals.chatMessageCreate;
    realtimeModeration.deliveryDecision = originals.deliveryDecision;
    notificationService.createNotification = originals.createNotification;
    if (readyStateDescriptor)
      Object.defineProperty(
        mongoose.connection,
        "readyState",
        readyStateDescriptor,
      );
  }
}

async function verifySocketBaseline(observability) {
  const originalSecret = process.env.REALTIME_TOKEN_SECRET;
  const originalConcurrent = process.env.REALTIME_MAX_CONCURRENT_OPERATIONS;
  const originalQueued = process.env.REALTIME_MAX_QUEUED_OPERATIONS;
  process.env.REALTIME_TOKEN_SECRET = "self-check-realtime-secret";
  process.env.REALTIME_MAX_CONCURRENT_OPERATIONS = "4";
  process.env.REALTIME_MAX_QUEUED_OPERATIONS = "128";

  const chat = require("../backend/src/services/chatMessaging");
  const originalPersistMessage = chat.persistMessage;
  chat.persistMessage = async ({
    actorUserId,
    channelId,
    clientMessageId,
    body,
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 4));
    return {
      valid: true,
      status: 201,
      duplicate: false,
      message: {
        messageId: `server-${clientMessageId}`,
        clientMessageId,
        channelId,
        senderUserId: actorUserId,
        body,
        createdAt: new Date(),
      },
      deliverTo: [],
    };
  };

  const socketServerPath =
    require.resolve("../backend/src/realtime/socketServer");
  delete require.cache[socketServerPath];
  const { attachRealtimeServer } = require(socketServerPath);
  const {
    mintSocketToken,
  } = require("../backend/src/services/realtimeGateway");
  const server = http.createServer();
  const ioServer = attachRealtimeServer(server);
  const clients = [];

  try {
    observability.resetRealtimeObservability();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const connectionStarted = Date.now();
    clients.push(
      ...(await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          connectClient(
            url,
            mintSocketToken({
              userId: `self-check-user-${index}`,
              correlationId: `self-check-trace-${index}`,
            }),
          ),
        ),
      )),
    );
    const connectionDurationMs = Date.now() - connectionStarted;
    const resumes = await Promise.all(
      clients.map((client) =>
        emitWithAck(client, "realtime.resume", { channels: [] }),
      ),
    );
    assert.ok(resumes.every((ack) => ack.ok));

    const burstStarted = Date.now();
    const acknowledgements = await Promise.all(
      clients.flatMap((client, clientIndex) =>
        Array.from({ length: 4 }, (_, messageIndex) =>
          emitWithAck(client, "chat.send", {
            channelId: "self-check-channel",
            clientMessageId: `${clientIndex}-${messageIndex}`,
            body: "synthetic-load-message",
          }),
        ),
      ),
    );
    const burstDurationMs = Date.now() - burstStarted;
    assert.ok(acknowledgements.every((ack) => ack.ok));

    const metrics = observability.realtimeMetricsSnapshot();
    assert.equal(metrics.counters.connectionSuccesses, 12);
    assert.equal(metrics.counters.resumeSuccesses, 12);
    assert.equal(metrics.counters.messagesPersisted, 48);
    assert.equal(metrics.counters.backpressureRejected || 0, 0);
    assert.ok(metrics.latency.messageProcessingMs.p95Ms < 1000);
    return {
      connections: 12,
      messages: 48,
      connectionDurationMs,
      burstDurationMs,
      messageP95Ms: metrics.latency.messageProcessingMs.p95Ms,
      queuedOperations: metrics.counters.backpressureQueued || 0,
      rejectedOperations: metrics.counters.backpressureRejected || 0,
    };
  } finally {
    for (const client of clients) client.close();
    await new Promise((resolve) => ioServer.close(resolve));
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    chat.persistMessage = originalPersistMessage;
    if (originalSecret === undefined) delete process.env.REALTIME_TOKEN_SECRET;
    else process.env.REALTIME_TOKEN_SECRET = originalSecret;
    if (originalConcurrent === undefined)
      delete process.env.REALTIME_MAX_CONCURRENT_OPERATIONS;
    else process.env.REALTIME_MAX_CONCURRENT_OPERATIONS = originalConcurrent;
    if (originalQueued === undefined)
      delete process.env.REALTIME_MAX_QUEUED_OPERATIONS;
    else process.env.REALTIME_MAX_QUEUED_OPERATIONS = originalQueued;
  }
}

async function main() {
  process.env.NODE_ENV = "test";
  const observability = require("../backend/src/services/realtimeObservability");
  await verifyBackpressure(observability);
  await verifyRedisFallback(observability);
  await verifyMetricsAccess(observability);
  await verifyDurableDelivery(observability);
  const baseline = await verifySocketBaseline(observability);
  console.log(JSON.stringify({ success: true, baseline }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
