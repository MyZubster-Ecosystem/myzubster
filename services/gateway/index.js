'use strict';

/**
 * API Gateway: unified entry point for all microservices.
 * Discovers healthy instances from the registry and reverse-proxies requests.
 * Uses only Node.js built-in modules (no external dependencies).
 */

const http = require('http');

const PORT = parseInt(process.env.GATEWAY_PORT || '8080', 10);
const REGISTRY_HOST = process.env.REGISTRY_HOST || 'registry';
const REGISTRY_PORT = parseInt(process.env.REGISTRY_PORT || '8500', 10);

// Route prefix -> service name
const ROUTES = {
  '/auth': 'auth',
  '/gardens': 'gardens',
  '/bounties': 'bounties',
  '/ai': 'ai',
  '/notifications': 'notifications',
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function discover(serviceName) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: REGISTRY_HOST,
        port: REGISTRY_PORT,
        path: `/services/${encodeURIComponent(serviceName)}`,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).instances || []);
          } catch (e) {
            resolve([]);
          }
        });
      }
    );
    req.on('error', () => resolve([]));
  });
}

function proxy(req, res, instance, downstreamPath) {
  const proxyReq = http.request(
    {
      host: instance.host,
      port: instance.port,
      path: downstreamPath,
      method: req.method,
      headers: { ...req.headers, host: `${instance.host}:${instance.port}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (err) => {
    json(res, 502, { error: 'bad gateway', detail: err.message });
  });
  req.pipe(proxyReq);
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    return json(res, 400, { error: 'bad request url' });
  }
  const path = url.pathname;

  if (path === '/health') {
    return json(res, 200, { status: 'ok', service: 'gateway' });
  }

  if (path === '/' || path === '/routes') {
    return json(res, 200, { service: 'gateway', routes: ROUTES });
  }

  const prefix = Object.keys(ROUTES).find((p) => path === p || path.startsWith(`${p}/`));
  if (!prefix) {
    return json(res, 404, { error: 'no route', path, routes: Object.keys(ROUTES) });
  }

  const serviceName = ROUTES[prefix];
  const instances = await discover(serviceName);
  if (!instances.length) {
    return json(res, 503, { error: 'service unavailable', service: serviceName });
  }

  // Simple load balancing across healthy instances.
  const instance = instances[Math.floor(Math.random() * instances.length)];
  const stripped = path.slice(prefix.length) || '/';
  const downstreamPath = stripped + url.search;
  return proxy(req, res, instance, downstreamPath);
});

server.listen(PORT, () => {
  console.log(`[gateway] API gateway listening on :${PORT}`);
});
