const http = require('http');
const https = require('https');
const { URL } = require('url');

// Gateway API integration for the MyZubster Space Station MVP.
// All configuration is read from environment variables - no secrets committed.
//   GATEWAY_BASE_URL   base URL of the MyZubster Gateway (default http://localhost:4000)
//   GATEWAY_API_TOKEN  optional bearer token for authenticated requests
//   GATEWAY_TIMEOUT_MS request timeout in milliseconds (default 8000)

const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL || 'http://localhost:4000';
const GATEWAY_API_TOKEN = process.env.GATEWAY_API_TOKEN || '';
const GATEWAY_TIMEOUT_MS = Number(process.env.GATEWAY_TIMEOUT_MS) || 8000;

function gatewayRequest(path, options) {
  const opts = options || {};
  const method = (opts.method || 'GET').toUpperCase();
  const base = GATEWAY_BASE_URL.replace(/\/$/, '');
  const target = new URL(base + path);
  const lib = target.protocol === 'https:' ? https : http;

  const headers = { Accept: 'application/json' };
  if (GATEWAY_API_TOKEN) headers.Authorization = 'Bearer ' + GATEWAY_API_TOKEN;
  if (opts.body) headers['Content-Type'] = 'application/json';

  const payload = opts.body ? JSON.stringify(opts.body) : null;
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: method,
      headers: headers,
      timeout: GATEWAY_TIMEOUT_MS,
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          data: data,
        });
      });
    });
    req.on('timeout', () => req.destroy(new Error('Gateway request timed out')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function health() {
  const res = await gatewayRequest('/health');
  return { reachable: res.ok, status: res.status, data: res.data };
}

async function relay(body) {
  return gatewayRequest('/api/relay', { method: 'POST', body: body });
}

module.exports = {
  gatewayRequest,
  health,
  relay,
  config: { baseUrl: GATEWAY_BASE_URL, timeoutMs: GATEWAY_TIMEOUT_MS },
};
