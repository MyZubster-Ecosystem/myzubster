const http = require('node:http');
const { verifyMyzPayment } = require('./verifier');

const port = Number(process.env.PORT || 8787);
const MAX_BODY_BYTES = 16 * 1024;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(new Error('request too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    return sendJson(res, 200, { ok: true, service: 'myz-independent-verifier' });
  }

  if (req.method !== 'POST' || req.url !== '/verify') {
    return sendJson(res, 404, { error: 'not found' });
  }

  try {
    const body = await readJson(req);
    const result = await verifyMyzPayment({
      txid: body.txid,
      recipient: body.recipient,
      asset: body.asset,
      network: body.network,
      amount: body.amount,
    });
    return sendJson(res, result.verified ? 200 : 422, result);
  } catch (error) {
    return sendJson(res, 503, { verified: false, reason: 'verifier unavailable' });
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`MYZ independent verifier listening on ${port}`);
  });
}

module.exports = server;
