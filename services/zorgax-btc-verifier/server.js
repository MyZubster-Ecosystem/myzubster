'use strict';

const http = require('http');
const { execFile } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.ZORGAX_BTC_VERIFIER_TOKEN || '';
const ELECTRUM_BIN = process.env.ELECTRUM_BIN || 'electrum';
const ELECTRUM_WALLET = process.env.ELECTRUM_WALLET || '';

function equalToken(header) {
  const supplied = String(header || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(supplied); const b = Buffer.from(TOKEN);
  return Boolean(TOKEN) && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function electrum(args) {
  const walletArgs = ELECTRUM_WALLET ? ['-w', ELECTRUM_WALLET] : [];
  const { stdout } = await execFileAsync(ELECTRUM_BIN, [...walletArgs, ...args], { timeout: 15000, maxBuffer: 1024 * 1024 });
  return JSON.parse(stdout);
}

function btcFromSats(value) { return Number(value) / 100000000; }

async function verify({ paymentReference, destination, expectedAmount }) {
  if (!/^[0-9a-fA-F]{64}$/.test(String(paymentReference || ''))) throw new Error('TXID non valido');
  if (!destination || !Number.isFinite(Number(expectedAmount)) || Number(expectedAmount) <= 0) throw new Error('Richiesta non valida');

  const tx = await electrum(['gettransaction', String(paymentReference)]);
  const confirmations = Number(tx.confirmations || 0);
  const outputs = Array.isArray(tx.outputs) ? tx.outputs : [];
  let paid = 0;
  for (const output of outputs) {
    const address = output.address || output.scriptpubkey_address;
    if (address !== destination) continue;
    const value = output.value;
    paid += typeof value === 'number' && value > 1000 ? btcFromSats(value) : Number(value || 0);
  }

  return {
    verified: paid >= Number(expectedAmount),
    asset: 'BTC',
    destination,
    amount: paid,
    confirmations,
    paymentReference: String(paymentReference),
    verifier: 'zorgax-btc-electrum-v1'
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, asset: 'BTC', verifier: 'zorgax-btc-electrum-v1' });
  if (req.method !== 'POST' || req.url !== '/verify') return send(res, 404, { ok: false });
  if (!equalToken(req.headers.authorization)) return send(res, 401, { ok: false, error: 'Unauthorized' });

  let raw = '';
  req.on('data', chunk => { raw += chunk; if (raw.length > 16384) req.destroy(); });
  req.on('end', async () => {
    try {
      const result = await verify(JSON.parse(raw || '{}'));
      send(res, result.verified ? 200 : 422, result);
    } catch (error) { send(res, 400, { ok: false, verified: false, error: error.message }); }
  });
});

if (!TOKEN) { console.error('ZORGAX_BTC_VERIFIER_TOKEN is required'); process.exit(1); }
server.listen(PORT, '127.0.0.1', () => console.log(`Zorgax BTC verifier listening on 127.0.0.1:${PORT}`));

module.exports = { verify };
