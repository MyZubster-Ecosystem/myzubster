const { Server } = require('socket.io');
const { verifySocketToken, authorizeChannel } = require('../services/realtimeGateway');
const { persistMessage } = require('../services/chatMessaging');

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

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      socket.data.actor = verifySocketToken(token);
      socket.data.subscriptions = new Set();
      next();
    } catch (_error) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const actor = socket.data.actor;
    socket.emit('realtime.ready', {
      connectionId: socket.id,
      correlationId: actor.correlationId,
      heartbeat: { pingIntervalMs: 25000, pingTimeoutMs: 20000 }
    });

    socket.on('channel.subscribe', async (payload = {}, ack = () => {}) => {
      try {
        const decision = await authorizeChannel({ channel: payload.channel, userId: actor.userId, role: actor.role });
        if (!decision.allowed) return ack({ ok: false, error: decision.reason });
        await socket.join(decision.channel);
        socket.data.subscriptions.add(decision.channel);
        return ack({ ok: true, channel: decision.channel });
      } catch (_error) {
        return ack({ ok: false, error: 'subscription_check_failed' });
      }
    });

    socket.on('channel.unsubscribe', async (payload = {}, ack = () => {}) => {
      const channel = String(payload.channel || '');
      if (!socket.data.subscriptions.has(channel)) return ack({ ok: true, channel });
      await socket.leave(channel);
      socket.data.subscriptions.delete(channel);
      return ack({ ok: true, channel });
    });

    socket.on('chat.send', async (payload = {}, ack = () => {}) => {
      try {
        const result = await persistMessage({
          actorUserId: actor.userId,
          actorRole: actor.role,
          channelId: payload.channelId,
          clientMessageId: payload.clientMessageId,
          body: payload.body
        });
        if (!result.valid) return ack({ ok: false, error: result.error, status: result.status });
        const event = publicMessage(result.message);
        if (!result.duplicate) {
          socket.emit('chat.message', event);
          for (const recipientUserId of result.deliverTo) io.to(`user:${recipientUserId}`).emit('chat.message', event);
        }
        return ack({ ok: true, duplicate: result.duplicate, message: event });
      } catch (_error) {
        return ack({ ok: false, error: 'message_delivery_failed' });
      }
    });

    socket.on('realtime.resume', async (payload = {}, ack = () => {}) => {
      const requested = Array.isArray(payload.channels) ? payload.channels.slice(0, 50) : [];
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
        } catch (_error) {
          rejected.push({ channel, reason: 'subscription_check_failed' });
        }
      }
      return ack({ ok: true, restored, rejected });
    });
  });

  return io;
}

module.exports = { attachRealtimeServer };
