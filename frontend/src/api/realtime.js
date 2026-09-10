import { io } from 'socket.io-client';

const WORLD_CHANNEL = 'world:neon-plaza';
const MAX_RETRY_DELAY_MS = 30000;

async function requestRealtimeToken() {
  const accountToken = localStorage.getItem('myzubster-token');
  if (!accountToken) throw new Error('Authenticated MyZubster account required');

  const response = await fetch('/api/realtime/token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accountToken}`,
      'Content-Type': 'application/json'
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) {
    throw new Error(payload.error || 'Realtime token unavailable');
  }
  return payload;
}

export function openMetaverseRealtime({ onEvent, onTransport } = {}) {
  let stopped = false;
  let connecting = false;
  let socket = null;
  let retryTimer = null;
  let retryAttempt = 0;

  const report = (transport) => {
    if (!stopped && typeof onTransport === 'function') onTransport(transport);
  };

  const clearRetry = () => {
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = null;
  };

  const scheduleRetry = () => {
    if (stopped) return;
    clearRetry();
    retryAttempt += 1;
    const delay = Math.min(MAX_RETRY_DELAY_MS, 1500 * (2 ** Math.min(retryAttempt - 1, 4)));
    retryTimer = window.setTimeout(connect, delay);
  };

  const connect = async () => {
    if (stopped || connecting) return;
    connecting = true;
    report('connecting');

    try {
      const ticket = await requestRealtimeToken();
      if (stopped) return;

      const nextSocket = io(window.location.origin, {
        path: ticket.socketPath || '/realtime',
        // A failed WebSocket cleanly falls back to the existing REST sync.
        // Avoid Socket.IO long-polling here because multi-instance polling
        // requires sticky sessions in addition to the Redis adapter.
        transports: ['websocket'],
        auth: { token: ticket.token },
        autoConnect: false,
        reconnection: false,
        timeout: 10000
      });
      let retired = false;
      socket = nextSocket;

      const retire = () => {
        if (retired) return;
        retired = true;
        if (socket === nextSocket) socket = null;
        nextSocket.removeAllListeners();
        nextSocket.close();
        report('polling');
        scheduleRetry();
      };

      nextSocket.on('connect', () => {
        nextSocket.timeout(5000).emit(
          'channel.subscribe',
          { channel: WORLD_CHANNEL },
          (error, result) => {
            if (error || !result?.ok) return retire();
            retryAttempt = 0;
            report('realtime');
          }
        );
      });
      nextSocket.on('metaverse.event', (event) => {
        if (!retired && typeof onEvent === 'function') onEvent(event);
      });
      nextSocket.on('disconnect', retire);
      nextSocket.on('connect_error', retire);
      nextSocket.connect();
    } catch (_error) {
      report('polling');
      scheduleRetry();
    } finally {
      connecting = false;
    }
  };

  connect();

  return () => {
    stopped = true;
    clearRetry();
    if (socket) {
      socket.removeAllListeners();
      socket.close();
      socket = null;
    }
  };
}
