#!/usr/bin/env node
/**
 * API Gateway — unified entry point for the myzubster microservices.
 *
 * Routes inbound REST requests to the correct upstream service by path prefix.
 * Built only on Node.js built-ins (no new dependencies).
 *
 * Route table:
 *   /auth          -> Auth service
 *   /gardens       -> Gardens service
 *   /bounties      -> Bounties service
 *   /ai            -> AI service
 *   /notifications -> Notifications service
 */
'use strict';

const http = require('http');
const { URL } = require('url');

const { ServiceRegistry } = require('./serviceRegistry');

const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT, 10) || 8080;
const TIMEOUT_MS = parseInt(process.env.GATEWAY_TIMEOUT_MS, 10) || 15000;

const registry = new ServiceRegistry();

registry.register('auth', process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001');
registry.register('gardens', process.env.GARDENS_SERVICE_URL || 'http://127.0.0.1:3002');
registry.register('bounties', process.env.BOUNTIES_SERVICE_URL || 'http://127.0.0.1:3003');
registry.register('ai', process.env.AI_SERVICE_URL || 'http://127.0.0.1:3004');
registry.register('notifications', process.env.NOTIFICATIONS_SERVICE_URL || 'http://127.0.0.1:3005');

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function notFound(res) {
  sendJson(res, 404, { error: 'NotFound', message: 'No service registered for this route.' });
}

function proxyRequest(req, res, serviceName, downstreamPath) {
  const upstream = registry.resolve(serviceName);
  if (!upstream) return notFound(res);

  const target = new URL(upstream);
  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: downstreamPath || '/',
    headers: Object.assign({}, req.headers, {
      host: target.host,
      'x-forwarded-service': serviceName,
    }),
    timeout: TIMEOUT_MS,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => proxyReq.destroy(new Error('Upstream timeout')));

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      sendJson(res, 502, { error: 'BadGateway', service: serviceName, message: err.message });
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
}

function route(req) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = url.pathname;

  if (pathname === '/health') return { type: 'health' };
  if (pathname === '/services') return { type: 'services' };

  const segments = pathname.split('/').filter(Boolean);
  const prefix = segments.length ? segments[0].toLowerCase() : null;

  if (prefix && registry.has(prefix)) {
    const rest = '/' + segments.slice(1).join('/');
    return { type: 'proxy', service: prefix, path: rest + (url.search || '') };
  }

  return { type: 'unmatched' };
}

const server = http.createServer((req, res) => {
  const decision = route(req);

  if (decision.type === 'health') {
    return sendJson(res, 200, { status: 'ok', gateway: true, timestamp: new Date().toISOString() });
  }
  if (decision.type === 'services') {
    return sendJson(res, 200, { services: registry.describe() });
  }
  if (decision.type === 'proxy') {
    return proxyRequest(req, res, decision.service, decision.path);
  }
  return notFound(res);
});

if (require.main === module) {
  server.listen(GATEWAY_PORT, () => {
    console.log('[api-gateway] listening on :' + GATEWAY_PORT);
    console.log('[api-gateway] routes: ' + registry.describe().map((s) => '/' + s.name).join(', '));
  });
}

module.exports = { server, registry, route };
