const { io } = require('socket.io-client');

const baseUrl = process.env.REALTIME_BASE_URL || 'http://localhost:3009';
const token = process.env.REALTIME_TEST_TOKEN;
const clients = Math.max(1, Number(process.env.REALTIME_LOAD_CLIENTS || 25));
const holdMs = Math.max(1000, Number(process.env.REALTIME_LOAD_HOLD_MS || 5000));

if (!token) {
  console.error('REALTIME_TEST_TOKEN is required');
  process.exit(2);
}

const results = { requested: clients, connected: 0, failed: 0, readyLatenciesMs: [] };
const sockets = [];

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function connectOne(index) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = io(baseUrl, {
      path: '/realtime',
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
      timeout: 10000
    });
    sockets.push(socket);
    let settled = false;
    socket.once('realtime.ready', () => {
      if (settled) return;
      settled = true;
      results.connected += 1;
      results.readyLatenciesMs.push(Date.now() - started);
      resolve();
    });
    socket.once('connect_error', (error) => {
      if (settled) return;
      settled = true;
      results.failed += 1;
      console.error(JSON.stringify({ client: index, event: 'connect_error', message: error.message }));
      resolve();
    });
  });
}

(async () => {
  await Promise.all(Array.from({ length: clients }, (_, index) => connectOne(index)));
  await new Promise((resolve) => setTimeout(resolve, holdMs));
  for (const socket of sockets) socket.close();

  const summary = {
    ...results,
    successRate: results.requested ? results.connected / results.requested : 0,
    readyLatencyMs: {
      p50: percentile(results.readyLatenciesMs, 50),
      p95: percentile(results.readyLatenciesMs, 95),
      max: results.readyLatenciesMs.length ? Math.max(...results.readyLatenciesMs) : null
    }
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.successRate >= 0.99 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
