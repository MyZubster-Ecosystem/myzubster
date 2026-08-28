'use strict';

/**
 * Shared microservice runtime: HTTP server + service-registry client.
 * Uses only Node.js built-in modules (no external dependencies).
 */

const http = require('http');

const REGISTRY_HOST = process.env.REGISTRY_HOST || 'registry';
const REGISTRY_PORT = parseInt(process.env.REGISTRY_PORT || '8500', 10);
const HEARTBEAT_MS = parseInt(process.env.HEARTBEAT_MS || '10000', 10);

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
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function registerWithRegistry(name, host, port) {
  const payload = JSON.stringify({ name, host, port });
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: REGISTRY_HOST,
        port: REGISTRY_PORT,
        path: '/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

/**
 * Start a microservice.
 * @param {object} opts
 * @param {string} opts.name     service name used for discovery (matches compose service name)
 * @param {number} opts.port     port to listen on
 * @param {object} opts.handlers map of 'METHOD /path' -> async (req, res, ctx) => ...
 */
function startService({ name, port, handlers = {} }) {
  const host = process.env.SERVICE_HOST || name;

  const server = http.createServer(async (req, res) => {
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch (e) {
      return json(res, 400, { error: 'bad request url' });
    }
    const path = url.pathname;

    if (path === '/health') {
      return json(res, 200, {
        status: 'ok',
        service: name,
        timestamp: new Date().toISOString(),
      });
    }

    const handler = handlers[`${req.method} ${path}`] || handlers[path];
    if (handler) {
      try {
        const body = await readBody(req);
        await handler(req, res, { url, body });
      } catch (err) {
        json(res, 500, { error: err.message, service: name });
      }
      return;
    }

    return json(res, 404, { error: 'not found', service: name, path });
  });

  server.listen(port, () => {
    console.log(`[${name}] listening on :${port}`);

    const heartbeat = async () => {
      const ok = await registerWithRegistry(name, host, port);
      if (!ok) console.warn(`[${name}] registry heartbeat failed`);
    };

    const connect = async () => {
      const ok = await registerWithRegistry(name, host, port);
      if (ok) {
        console.log(`[${name}] registered with registry`);
      } else {
        console.warn(`[${name}] registry not reachable, retrying in 3s`);
        setTimeout(connect, 3000);
      }
    };
    connect();
    setInterval(heartbeat, HEARTBEAT_MS).unref();
  });

  return server;
}

module.exports = { startService, json, readBody };
