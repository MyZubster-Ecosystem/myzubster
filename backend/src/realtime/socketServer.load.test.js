const http = require("http");
const { io: createClient } = require("socket.io-client");

jest.mock("../services/chatMessaging", () => ({ persistMessage: jest.fn() }));

const { persistMessage } = require("../services/chatMessaging");
const { attachRealtimeServer } = require("./socketServer");
const { mintSocketToken } = require("../services/realtimeGateway");
const {
  realtimeMetricsSnapshot,
  resetRealtimeObservability,
} = require("../services/realtimeObservability");

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
      reject(new Error("Realtime load-test connection timed out"));
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
      () => reject(new Error(`${event} acknowledgement timed out`)),
      6000,
    );
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

describe("realtime concurrent connection and chat-burst baseline", () => {
  jest.setTimeout(30000);
  let server;
  let ioServer;
  let clients = [];
  let originalSecret;
  let originalConcurrent;
  let originalQueue;

  beforeAll(async () => {
    originalSecret = process.env.REALTIME_TOKEN_SECRET;
    originalConcurrent = process.env.REALTIME_MAX_CONCURRENT_OPERATIONS;
    originalQueue = process.env.REALTIME_MAX_QUEUED_OPERATIONS;
    process.env.REALTIME_TOKEN_SECRET = "load-test-realtime-secret";
    process.env.REALTIME_MAX_CONCURRENT_OPERATIONS = "4";
    process.env.REALTIME_MAX_QUEUED_OPERATIONS = "128";
    resetRealtimeObservability();

    persistMessage.mockImplementation(
      async ({ actorUserId, channelId, clientMessageId, body }) => {
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
      },
    );

    server = http.createServer();
    ioServer = attachRealtimeServer(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  });

  afterAll(async () => {
    for (const client of clients) client.close();
    if (ioServer) await new Promise((resolve) => ioServer.close(resolve));
    if (server?.listening)
      await new Promise((resolve) => server.close(resolve));
    if (originalSecret === undefined) delete process.env.REALTIME_TOKEN_SECRET;
    else process.env.REALTIME_TOKEN_SECRET = originalSecret;
    if (originalConcurrent === undefined)
      delete process.env.REALTIME_MAX_CONCURRENT_OPERATIONS;
    else process.env.REALTIME_MAX_CONCURRENT_OPERATIONS = originalConcurrent;
    if (originalQueue === undefined)
      delete process.env.REALTIME_MAX_QUEUED_OPERATIONS;
    else process.env.REALTIME_MAX_QUEUED_OPERATIONS = originalQueue;
  });

  test("handles 12 concurrent sockets and a 48-message burst with bounded queuing", async () => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}`;
    const connectionStarted = Date.now();
    clients = await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const token = mintSocketToken({
          userId: `load-user-${index}`,
          correlationId: `load-trace-${index}`,
        });
        return connectClient(url, token);
      }),
    );
    const connectionDurationMs = Date.now() - connectionStarted;

    const resumeAcks = await Promise.all(
      clients.map((socket) =>
        emitWithAck(socket, "realtime.resume", { channels: [] }),
      ),
    );
    expect(resumeAcks.every((ack) => ack.ok)).toBe(true);

    const burstStarted = Date.now();
    const acknowledgements = await Promise.all(
      clients.flatMap((socket, clientIndex) =>
        Array.from({ length: 4 }, (_, messageIndex) =>
          emitWithAck(socket, "chat.send", {
            channelId: "load-channel",
            clientMessageId: `${clientIndex}-${messageIndex}`,
            body: "synthetic-load-message",
          }),
        ),
      ),
    );
    const burstDurationMs = Date.now() - burstStarted;

    expect(acknowledgements).toHaveLength(48);
    expect(acknowledgements.every((ack) => ack.ok)).toBe(true);

    const metrics = realtimeMetricsSnapshot();
    expect(metrics.counters).toMatchObject({
      connectionAttempts: 12,
      connectionSuccesses: 12,
      resumeAttempts: 12,
      resumeSuccesses: 12,
      messageAttempts: 48,
      messagesPersisted: 48,
    });
    expect(metrics.counters.backpressureRejected || 0).toBe(0);
    expect(metrics.latency.messageProcessingMs.p95Ms).toBeLessThan(1000);

    console.log(
      JSON.stringify({
        baseline: "socket-io-ci-synthetic",
        connections: 12,
        messages: 48,
        connectionDurationMs,
        burstDurationMs,
        messageP95Ms: metrics.latency.messageProcessingMs.p95Ms,
        rejected: metrics.counters.backpressureRejected || 0,
      }),
    );
  });
});
