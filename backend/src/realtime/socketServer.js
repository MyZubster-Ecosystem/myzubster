const { Server } = require('socket.io');
const { verifySocketToken, authorizeChannel } = require('../services/realtimeGateway');
const { persistMessage } = require('../services/chatMessaging');
const { registerRealtimeIO } = require('./realtimeHub');
const { joinPresence, touchPresence, leavePresence, visibleMembers, presenceMode } = require('../services/realtimePresence');
const { increment, setGauge, observe, structuredLog } = require('../services/realtimeObservability');

function publicMessage(message) {
  return {
    id: message.messageId,
    clientMessageId: message.clientMessageId,
    channelId: message.channelId,
    senderUserId: message.senderUserId,
    body: message.body,
    createdAt: message.createdAt
  };
}

function attachRealtimeServer(httpServer) {
  const io = new Server(httpServer, {
    path: '/realtime',
    transports: ['websocket', 'polling'],
    cors: { origin: true, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000
  });

  registerRealtimeIO(io);
  let activeConnections = 0;

  io.use((socket, next) => {
    const started = Date.now();
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      socket.data.actor = verifySocketToken(token);
      socket.data.subscriptions = new Set();
      socket.data.presenceChannels = new Set();
      increment('realtime_connection_auth_total', { outcome: 'success' });
      observe('realtime_connection_auth_latency_ms', Date.now() - started);
      next();
    } catch (_error) {
      increment('realtime_connection_auth_total', { outcome: 'failure' });
      structuredLog('realtime.connection_auth', { outcome: 'failure', latencyMs: Date.now() - started });
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const actor = socket.data.actor;
    activeConnections += 1;
    setGauge('realtime_active_connections', activeConnections);
    increment('realtime_connections_total', { outcome: 'success' });
    structuredLog('realtime.connection_open', { connectionId: socket.id, correlationId: actor.correlationId, outcome: 'success' });

    socket.emit('realtime.ready', {
      connectionId: socket.id,
      correlationId: actor.correlationId,
      heartbeat: { pingIntervalMs: 25000, pingTimeoutMs: 20000 },
      presence: { mode: presenceMode(), staleAfterMs: 90000 }
    });

    socket.on('channel.subscribe', async (payload = {}, ack = () => {}) => {
      const started = Date.now();
      try {
        const decision = await authorizeChannel({ channel: payload.channel, userId: actor.userId, role: actor.role });
        if (!decision.allowed) {
          increment('realtime_subscriptions_total', { outcome: 'denied' });
          return ack({ ok: false, error: decision.reason });
        }
        await socket.join(decision.channel);
        socket.data.subscriptions.add(decision.channel);
        increment('realtime_subscriptions_total', { outcome: 'success' });
        observe('realtime_subscription_latency_ms', Date.now() - started);
        return ack({ ok: true, channel: decision.channel });
      } catch (_error) {
        increment('realtime_subscriptions_total', { outcome: 'failure' });
        return ack({ ok: false, error: 'subscription_check_failed' });
      }
    });

    socket.on('channel.unsubscribe', async (payload = {}, ack = () => {}) => {
      const channel = String(payload.channel || '');
      if (socket.data.presenceChannels.has(channel)) {
        const result = await leavePresence({ channel, userId: actor.userId, connectionId: socket.id });
        socket.data.presenceChannels.delete(channel);
        if (result.lastConnection) io.to(channel).emit('presence.leave', result.membership);
      }
      if (!socket.data.subscriptions.has(channel)) return ack({ ok: true, channel });
      await socket.leave(channel);
      socket.data.subscriptions.delete(channel);
      return ack({ ok: true, channel });
    });

    socket.on('presence.join', async (payload = {}, ack = () => {}) => {
      try {
        const decision = await authorizeChannel({ channel: payload.channel, userId: actor.userId, role: actor.role });
        if (!decision.allowed) return ack({ ok: false, error: decision.reason });
        await socket.join(decision.channel);
        socket.data.subscriptions.add(decision.channel);
        socket.data.presenceChannels.add(decision.channel);
        const joined = await joinPresence({ channel: decision.channel, userId: actor.userId, connectionId: socket.id });
        if (joined.firstConnection) socket.to(decision.channel).emit('presence.join', joined.membership);
        const snapshot = await visibleMembers({ channel: decision.channel, viewerUserId: actor.userId });
        increment('realtime_presence_join_total', { outcome: 'success', mode: snapshot.mode });
        return ack({ ok: true, channel: decision.channel, mode: snapshot.mode, members: snapshot.members });
      } catch (_error) {
        increment('realtime_presence_join_total', { outcome: 'failure' });
        return ack({ ok: false, error: 'presence_join_failed' });
      }
    });

    socket.on('presence.heartbeat', async (payload = {}, ack = () => {}) => {
      try {
        const channel = String(payload.channel || '');
        const ok = socket.data.presenceChannels.has(channel) && await touchPresence({ channel, userId: actor.userId, connectionId: socket.id });
        increment('realtime_presence_heartbeat_total', { outcome: ok ? 'success' : 'miss' });
        return ack({ ok: Boolean(ok) });
      } catch (_error) {
        increment('realtime_presence_heartbeat_total', { outcome: 'failure' });
        return ack({ ok: false, error: 'presence_heartbeat_failed' });
      }
    });

    socket.on('presence.leave', async (payload = {}, ack = () => {}) => {
      try {
        const channel = String(payload.channel || '');
        const result = await leavePresence({ channel, userId: actor.userId, connectionId: socket.id });
        socket.data.presenceChannels.delete(channel);
        if (result.lastConnection) io.to(channel).emit('presence.leave', result.membership);
        increment('realtime_presence_leave_total', { outcome: 'success' });
        return ack({ ok: true, channel });
      } catch (_error) {
        increment('realtime_presence_leave_total', { outcome: 'failure' });
        return ack({ ok: false, error: 'presence_leave_failed' });
      }
    });

    socket.on('chat.send', async (payload = {}, ack = () => {}) => {
      const started = Date.now();
      try {
        const result = await persistMessage({
          actorUserId: actor.userId,
          actorRole: actor.role,
          channelId: payload.channelId,
          clientMessageId: payload.clientMessageId,
          body: payload.body
        });
        if (!result.valid) {
          increment('realtime_message_persist_total', { outcome: 'failure', status: result.status || 'unknown' });
          structuredLog('realtime.message_persist', { connectionId: socket.id, correlationId: actor.correlationId, outcome: 'failure', reason: result.error, latencyMs: Date.now() - started });
          return ack({ ok: false, error: result.error, status: result.status });
        }
        const event = publicMessage(result.message);
        increment('realtime_message_persist_total', { outcome: result.duplicate ? 'duplicate' : 'success' });
        if (!result.duplicate) {
          socket.emit('chat.message', event);
          for (const recipientUserId of result.deliverTo) io.to(`user:${recipientUserId}`).emit('chat.message', event);
          increment('realtime_message_delivery_total', { outcome: 'emitted' }, 1 + result.deliverTo.length);
        }
        const latencyMs = Date.now() - started;
        observe('realtime_message_ack_latency_ms', latencyMs);
        structuredLog('realtime.message_persist', { connectionId: socket.id, correlationId: actor.correlationId, messageId: event.id, outcome: 'success', latencyMs });
        return ack({ ok: true, duplicate: result.duplicate, message: event });
      } catch (_error) {
        increment('realtime_message_persist_total', { outcome: 'exception' });
        return ack({ ok: false, error: 'message_delivery_failed' });
      }
    });

    socket.on('realtime.resume', async (payload = {}, ack = () => {}) => {
      const started = Date.now();
      const requested = Array.isArray(payload.channels) ? payload.channels.slice(0, 50) : [];
      const requestedPresence = new Set(Array.isArray(payload.presenceChannels) ? payload.presenceChannels.slice(0, 50).map(String) : []);
      const restored = [];
      const rejected = [];
      for (const channel of requested) {
        try {
          const decision = await authorizeChannel({ channel, userId: actor.userId, role: actor.role });
          if (!decision.allowed) {
            rejected.push({ channel, reason: decision.reason });
            continue;
          }
          await socket.join(decision.channel);
          socket.data.subscriptions.add(decision.channel);
          restored.push(decision.channel);
          if (requestedPresence.has(decision.channel)) {
            socket.data.presenceChannels.add(decision.channel);
            const joined = await joinPresence({ channel: decision.channel, userId: actor.userId, connectionId: socket.id });
            if (joined.firstConnection) socket.to(decision.channel).emit('presence.join', joined.membership);
          }
        } catch (_error) {
          rejected.push({ channel, reason: 'subscription_check_failed' });
        }
      }
      increment('realtime_resume_total', { outcome: rejected.length ? 'partial' : 'success' });
      observe('realtime_resume_latency_ms', Date.now() - started);
      structuredLog('realtime.resume', { connectionId: socket.id, correlationId: actor.correlationId, outcome: rejected.length ? 'partial' : 'success', latencyMs: Date.now() - started });
      return ack({ ok: true, restored, rejected });
    });

    socket.on('disconnect', async (reason) => {
      activeConnections = Math.max(0, activeConnections - 1);
      setGauge('realtime_active_connections', activeConnections);
      increment('realtime_disconnect_total', { reason: reason || 'unknown' });
      structuredLog('realtime.connection_close', { connectionId: socket.id, correlationId: actor.correlationId, outcome: 'closed', reason });
      for (const channel of [...socket.data.presenceChannels]) {
        try {
          const result = await leavePresence({ channel, userId: actor.userId, connectionId: socket.id });
          if (result.lastConnection) io.to(channel).emit('presence.leave', result.membership);
        } catch (_error) {
          increment('realtime_presence_cleanup_total', { outcome: 'ttl_fallback' });
        }
      }
    });
  });

  return io;
}

module.exports = { attachRealtimeServer };
