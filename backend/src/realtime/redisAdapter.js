const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const {
  incrementCounter,
  logRealtimeEvent
} = require('../services/realtimeObservability');

let adapterMode = 'local-fallback';
let adapterClients = [];

function redisAdapterConfigured() {
  return Boolean(process.env.REDIS_URL);
}

function fanoutMode() {
  return adapterMode;
}

function noteAdapterFailure(operation, error) {
  incrementCounter('redisFailures');
  logRealtimeEvent('redis_adapter_failure', {
    operation,
    status: 'local_fallback',
    reason: error?.name || 'redis_error',
    mode: 'local-fallback'
  }, 'warn');
}

async function initializeRealtimeAdapter(io, {
  createRedisClient = createClient,
  createSocketAdapter = createAdapter
} = {}) {
  if (!redisAdapterConfigured()) {
    adapterMode = 'local-fallback';
    return { mode: adapterMode };
  }

  try {
    const pubClient = createRedisClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    adapterClients = [pubClient, subClient];

    const updateMode = () => {
      adapterMode = pubClient.isReady && subClient.isReady
        ? 'redis'
        : 'redis-degraded';
    };
    for (const client of adapterClients) {
      client.on('ready', updateMode);
      client.on('end', updateMode);
      client.on('error', (error) => {
        updateMode();
        noteAdapterFailure('client', error);
      });
    }

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createSocketAdapter(pubClient, subClient, {
      key: 'myzubster:socket.io',
      publishOnSpecificResponseChannel: true
    }));
    adapterMode = 'redis';
    logRealtimeEvent('redis_adapter_ready', {
      status: 'ready',
      mode: 'redis'
    });
    return { mode: adapterMode };
  } catch (error) {
    noteAdapterFailure('connect', error);
    adapterMode = 'local-fallback';
    await Promise.allSettled(adapterClients.map(async (client) => {
      if (client.isOpen) await client.disconnect();
    }));
    adapterClients = [];
    return { mode: adapterMode };
  }
}

async function resetRealtimeAdapterForTests() {
  await Promise.allSettled(adapterClients.map(async (client) => {
    if (client.isOpen) await client.disconnect();
  }));
  adapterClients = [];
  adapterMode = 'local-fallback';
}

module.exports = {
  fanoutMode,
  initializeRealtimeAdapter,
  redisAdapterConfigured,
  resetRealtimeAdapterForTests
};
