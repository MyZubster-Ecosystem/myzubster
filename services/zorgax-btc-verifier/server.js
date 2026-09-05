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

async function electrumRaw(args, { wallet = true } = {}) {
  const walletArgs = wallet && ELECTRUM_WALLET ? ['-w', ELECTRUM_WALLET] : [];
  const { stdout } = await execFileAsync(ELECTRUM_BIN, [...walletArgs, ...args], { timeout: 15000, maxBuffer: 1024 * 1024 });
  return String(stdout).trim();
}

async function electrumJson(args, options) {
  const stdout = await electrumRaw(args, options);
  return JSON.parse(stdout);
}

function btcToSats(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(text)) throw new Error('Importo BTC non valido');
  const [whole, fraction = ''] = text.split('.');
  return (BigInt(whole) * 100000000n) + BigInt(fraction.padEnd(8, '0'));
}

function satsToBtcNumber(value) {
  return Number(value) / 100000000;
}

async function verify({ paymentReference, destination, expectedAmount }) {
  const txid = String(paymentReference || '');
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) throw new Error('TXID non valido');
  if (!destination) throw new Error('Richiesta non valida');

  const expectedSats = btcToSats(expectedAmount);
  if (expectedSats <= 0n) throw new Error('Richiesta non valida');

  // Electrum 4.8.1 returns serialized transaction hex from gettransaction.
  // Decode it explicitly so output amounts are consumed as integer satoshis.
  const rawTx = await electrumRaw(['gettransaction', txid]);
  if (!/^[0-9a-fA-F]+$/.test(rawTx)) throw new Error('Transazione Electrum non valida');
  const tx = await electrumJson(['deserialize', rawTx], { wallet: false });

  // get_tx_status is wallet-related and reports confirmations separately.
  const status = await electrumJson(['get_tx_status', txid]);
  const confirmations = Math.max(0, Number(status.confirmations || 0));

  const outputs = Array.isArray(tx.outputs) ? tx.outputs : [];
  let paidSats = 0n;
  for (const output of outputs) {
    if (output.address !== destination) continue;
    if (!Number.isSafeInteger(output.value_sats) || output.value_sats < 0) {
      throw new Error('Output Electrum non valido');
    }
    paidSats += BigInt(output.value_sats);
  }

  return {
    verified: paidSats >= expectedSats,
    asset: 'BTC',
    destination,
    amount: satsToBtcNumber(paidSats),
    confirmations,
    paymentReference: txid,
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
