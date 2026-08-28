'use strict';

/**
 * Service Discovery Registry (Consul-like, dependency-free).
 * Services register on startup and re-register as a heartbeat.
 * Stale instances are reaped after TTL_MS without a heartbeat.
 */

const http = require('http');

const PORT = parseInt(process.env.REGISTRY_PORT || '8500', 10);
const TTL_MS = parseInt(process.env.REGISTRY_TTL_MS || '30000', 10);

// services: { [name]: { [instanceId]: { name, host, port, id, lastSeen } } }
const services = {};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function healthyInstances(name) {
  const now = Date.now();
  return Object.values(services[name] || {}).filter((i) => now - i.lastSeen < TTL_MS);
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    return json(res, 400, { error: 'bad request url' });
  }
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { status: 'ok', service: 'registry' });
  }

  if (req.method === 'POST' && path === '/register') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const { name, host, port } = body;
      if (!name || !host || !port) {
        return json(res, 400, { error: 'name, host and port are required' });
      }
      const id = `${host}:${port}`;
      services[name] = services[name] || {};
      services[name][id] = { name, host, port, id, lastSeen: Date.now() };
      console.log(`[registry] registered ${name} at ${id}`);
      return json(res, 200, { registered: true, id });
    } catch (err) {
      return json(res, 400, { error: 'invalid payload' });
    }
  }

  if (req.method === 'POST' && path === '/deregister') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const { name, host, port } = body;
      const id = `${host}:${port}`;
      if (services[name] && services[name][id]) {
        delete services[name][id];
        console.log(`[registry] deregistered ${name} at ${id}`);
        return json(res, 200, { deregistered: true });
      }
      return json(res, 404, { error: 'instance not found' });
    } catch (err) {
      return json(res, 400, { error: 'invalid payload' });
    }
  }

  if (req.method === 'GET' && path === '/services') {
    const list = Object.keys(services).map((name) => ({
      name,
      instances: healthyInstances(name),
    }));
    return json(res, 200, { services: list });
  }

  const svcMatch = path.match(/^\/services\/([^/]+)$/);
  if (req.method === 'GET' && svcMatch) {
    const name = decodeURIComponent(svcMatch[1]);
    if (!services[name]) {
      return json(res, 404, { error: `service ${name} not found` });
    }
    return json(res, 200, { name, instances: healthyInstances(name) });
  }

  return json(res, 404, { error: 'not found', service: 'registry', path });
});

// Reap stale instances periodically.
setInterval(() => {
  const now = Date.now();
  for (const name of Object.keys(services)) {
    for (const id of Object.keys(services[name])) {
      if (now - services[name][id].lastSeen > TTL_MS) {
        console.log(`[registry] reaping stale instance ${name}/${id}`);
        delete services[name][id];
      }
    }
  }
}, 5000).unref();

server.listen(PORT, () => {
  console.log(`[registry] service discovery listening on :${PORT}`);
});
