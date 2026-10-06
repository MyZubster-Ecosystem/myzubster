const { Server } = require("socket.io");
const {
  verifySocketToken,
  authorizeChannel,
} = require("../services/realtimeGateway");
const { persistMessage } = require("../services/chatMessaging");
const { registerRealtimeIO } = require("./realtimeHub");
const {
  joinPresence,
  touchPresence,
  leavePresence,
  visibleMembers,
  presenceMode,
} = require("../services/realtimePresence");
const {
  RealtimeBackpressureError,
  adjustGauge,
  createBackpressureGate,
  incrementCounter,
  logRealtimeEvent,
  observeDuration,
  traceRef,
} = require("../services/realtimeObservability");

function publicMessage(message) {
  return {
    id: message.messageId,
    clientMessageId: message.clientMessageId,
    channelId: message.channelId,
    senderUserId: message.senderUserId,
    body: message.body,
    createdAt: message.createdAt,
  };
}

function attachRealtimeServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/realtime",
    transports: ["websocket", "polling"],
    cors: { origin: true, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });
  const operationGate = createBackpressureGate();

  registerRealtimeIO(io);

  io.use((socket, next) => {
    incrementCounter("connectionAttempts");
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
      socket.data.actor = verifySocketToken(token);
      socket.data.subscriptions = new Set();
      socket.data.presenceChannels = new Set();
      socket.data.traceId = traceRef(
        socket.data.actor.correlationId || socket.id,
      );
      next();
    } catch (error) {
      incrementCounter("connectionRejected");
      logRealtimeEvent(
        "connection_rejected",
        {
          socketRef: traceRef(socket.id),
          reason: error?.name || "authorization_failed",
        },
        "warn",
      );
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const actor = socket.data.actor;
    const privateChannel = `user:${actor.userId}`;
    socket.join(privateChannel);
    socket.data.subscriptions.add(privateChannel);
    incrementCounter("connectionSuccesses");
    adjustGauge("activeConnections", 1);
    if (socket.recovered) incrementCounter("connectionsRecovered");
    logRealtimeEvent("connection_ready", {
      traceId: socket.data.traceId,
      socketRef: traceRef(socket.id),
      status: "ready",
      recovered: Boolean(socket.recovered),
    });
    socket.emit("realtime.ready", {
      connectionId: socket.id,
      correlationId: actor.correlationId,
      heartbeat: { pingIntervalMs: 25000, pingTimeoutMs: 20000 },
      presence: { mode: presenceMode(), staleAfterMs: 90000 },
    });

    socket.on("channel.subscribe", async (payload = {}, ack = () => {}) => {
      try {
        const decision = await authorizeChannel({
          channel: payload.channel,
          userId: actor.userId,
          role: actor.role,
        });
        if (!decision.allowed)
          return ack({ ok: false, error: decision.reason });
        await socket.join(decision.channel);
        socket.data.subscriptions.add(decision.channel);
        return ack({ ok: true, channel: decision.channel });
      } catch (_error) {
        return ack({ ok: false, error: "subscription_check_failed" });
      }
    });

    socket.on("channel.unsubscribe", async (payload = {}, ack = () => {}) => {
      const channel = String(payload.channel || "");
      if (socket.data.presenceChannels.has(channel)) {
        const result = await leavePresence({
          channel,
          userId: actor.userId,
          connectionId: socket.id,
        });
        socket.data.presenceChannels.delete(channel);
        if (result.lastConnection)
          io.to(channel).emit("presence.leave", result.membership);
      }
      if (!socket.data.subscriptions.has(channel))
        return ack({ ok: true, channel });
      await socket.leave(channel);
      socket.data.subscriptions.delete(channel);
      return ack({ ok: true, channel });
    });

    socket.on("presence.join", async (payload = {}, ack = () => {}) => {
      try {
        const decision = await authorizeChannel({
          channel: payload.channel,
          userId: actor.userId,
          role: actor.role,
        });
        if (!decision.allowed)
          return ack({ ok: false, error: decision.reason });
        await socket.join(decision.channel);
        socket.data.subscriptions.add(decision.channel);
        socket.data.presenceChannels.add(decision.channel);
        const joined = await joinPresence({
          channel: decision.channel,
          userId: actor.userId,
          connectionId: socket.id,
        });
        if (joined.firstConnection)
          socket.to(decision.channel).emit("presence.join", joined.membership);
        const snapshot = await visibleMembers({
          channel: decision.channel,
          viewerUserId: actor.userId,
        });
        return ack({
          ok: true,
          channel: decision.channel,
          mode: snapshot.mode,
          members: snapshot.members,
        });
      } catch (_error) {
        return ack({ ok: false, error: "presence_join_failed" });
      }
    });

    socket.on("presence.heartbeat", async (payload = {}, ack = () => {}) => {
      try {
        const channel = String(payload.channel || "");
        const ok =
          socket.data.presenceChannels.has(channel) &&
          (await touchPresence({
            channel,
            userId: actor.userId,
            connectionId: socket.id,
          }));
        return ack({ ok: Boolean(ok) });
      } catch (_error) {
        return ack({ ok: false, error: "presence_heartbeat_failed" });
      }
    });

    socket.on("presence.leave", async (payload = {}, ack = () => {}) => {
      try {
        const channel = String(payload.channel || "");
        const result = await leavePresence({
          channel,
          userId: actor.userId,
          connectionId: socket.id,
        });
        socket.data.presenceChannels.delete(channel);
        if (result.lastConnection)
          io.to(channel).emit("presence.leave", result.membership);
        return ack({ ok: true, channel });
      } catch (_error) {
        return ack({ ok: false, error: "presence_leave_failed" });
      }
    });

    socket.on("chat.send", async (payload = {}, ack = () => {}) => {
      const started = Date.now();
      incrementCounter("messageAttempts");
      try {
        const result = await operationGate.run(() =>
          persistMessage({
            actorUserId: actor.userId,
            actorRole: actor.role,
            channelId: payload.channelId,
            clientMessageId: payload.clientMessageId,
            body: payload.body,
          }),
        );
        if (!result.valid) {
          incrementCounter("messageFailures");
          logRealtimeEvent(
            "message_rejected",
            {
              traceId: socket.data.traceId,
              socketRef: traceRef(socket.id),
              channelRef: traceRef(payload.channelId),
              status: result.status,
              reason: result.reason || result.error,
              durationMs: Date.now() - started,
            },
            result.status >= 500 ? "error" : "warn",
          );
          return ack({ ok: false, error: result.error, status: result.status });
        }
        const event = publicMessage(result.message);
        if (result.duplicate) incrementCounter("messagesDuplicate");
        else incrementCounter("messagesPersisted");
        if (!result.duplicate) {
          socket.emit("chat.message", event);
          incrementCounter("messageFanoutAttempts", result.deliverTo.length);
          for (const recipientUserId of result.deliverTo)
            io.to(`user:${recipientUserId}`).emit("chat.message", event);
        }
        logRealtimeEvent("message_processed", {
          traceId: socket.data.traceId,
          socketRef: traceRef(socket.id),
          channelRef: traceRef(payload.channelId),
          messageRef: traceRef(event.id),
          status: result.duplicate ? "duplicate" : "persisted",
          recipientCount: result.deliverTo.length,
          durationMs: Date.now() - started,
        });
        return ack({ ok: true, duplicate: result.duplicate, message: event });
      } catch (error) {
        incrementCounter("messageFailures");
        const overloaded =
          error instanceof RealtimeBackpressureError ||
          error?.code === "REALTIME_BACKPRESSURE";
        logRealtimeEvent(
          "message_failed",
          {
            traceId: socket.data.traceId,
            socketRef: traceRef(socket.id),
            channelRef: traceRef(payload.channelId),
            status: overloaded ? 503 : 500,
            reason: overloaded
              ? "realtime_backpressure"
              : error?.name || "message_delivery_failed",
            durationMs: Date.now() - started,
          },
          "error",
        );
        if (overloaded)
          return ack({
            ok: false,
            error: "realtime_backpressure",
            status: 503,
            retryable: true,
          });
        return ack({ ok: false, error: "message_delivery_failed" });
      } finally {
        observeDuration("messageProcessingMs", Date.now() - started);
      }
    });

    socket.on("realtime.resume", async (payload = {}, ack = () => {}) => {
      const started = Date.now();
      incrementCounter("resumeAttempts");
      try {
        const result = await operationGate.run(async () => {
          const requested = Array.isArray(payload.channels)
            ? payload.channels.slice(0, 50)
            : [];
          const requestedPresence = new Set(
            Array.isArray(payload.presenceChannels)
              ? payload.presenceChannels.slice(0, 50).map(String)
              : [],
          );
          const restored = [];
          const rejected = [];
          for (const channel of requested) {
            try {
              const decision = await authorizeChannel({
                channel,
                userId: actor.userId,
                role: actor.role,
              });
              if (!decision.allowed) {
                rejected.push({ channel, reason: decision.reason });
                continue;
              }
              await socket.join(decision.channel);
              socket.data.subscriptions.add(decision.channel);
              restored.push(decision.channel);
              if (requestedPresence.has(decision.channel)) {
                socket.data.presenceChannels.add(decision.channel);
                const joined = await joinPresence({
                  channel: decision.channel,
                  userId: actor.userId,
                  connectionId: socket.id,
                });
                if (joined.firstConnection)
                  socket
                    .to(decision.channel)
                    .emit("presence.join", joined.membership);
              }
            } catch (_error) {
              rejected.push({ channel, reason: "subscription_check_failed" });
            }
          }
          return { restored, rejected };
        });
        incrementCounter("resumeSuccesses");
        logRealtimeEvent("resume_processed", {
          traceId: socket.data.traceId,
          socketRef: traceRef(socket.id),
          status: "completed",
          durationMs: Date.now() - started,
        });
        return ack({ ok: true, ...result });
      } catch (error) {
        incrementCounter("resumeFailures");
        const overloaded =
          error instanceof RealtimeBackpressureError ||
          error?.code === "REALTIME_BACKPRESSURE";
        logRealtimeEvent(
          "resume_failed",
          {
            traceId: socket.data.traceId,
            socketRef: traceRef(socket.id),
            status: overloaded ? 503 : 500,
            reason: overloaded
              ? "realtime_backpressure"
              : error?.name || "resume_failed",
            durationMs: Date.now() - started,
          },
          "error",
        );
        return ack({
          ok: false,
          error: overloaded ? "realtime_backpressure" : "resume_failed",
          retryable: true,
        });
      } finally {
        observeDuration("resumeProcessingMs", Date.now() - started);
      }
    });

    socket.on("disconnect", async (reason) => {
      incrementCounter("disconnects");
      adjustGauge("activeConnections", -1);
      logRealtimeEvent("connection_closed", {
        traceId: socket.data.traceId,
        socketRef: traceRef(socket.id),
        status: "closed",
        reason: String(reason || "unknown").slice(0, 80),
      });
      for (const channel of [...socket.data.presenceChannels]) {
        try {
          const result = await leavePresence({
            channel,
            userId: actor.userId,
            connectionId: socket.id,
          });
          if (result.lastConnection)
            io.to(channel).emit("presence.leave", result.membership);
        } catch (_error) {
          // TTL cleanup will remove stale presence if Redis or the worker is unavailable.
        }
      }
    });
  });

  return io;
}

module.exports = { attachRealtimeServer };
