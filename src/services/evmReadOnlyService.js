async function rpc(url, method, params) {
  if (!url) throw new Error('RPC non configurato');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error(payload.error?.message || `RPC ${method} non disponibile`);
  return payload.result;
}

function normalizeAddress(value) {
  const address = String(value || '').trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(address)) throw new Error('Indirizzo EVM non valido');
  return address;
}

function signatureParts(signature) {
  const hex = String(signature || '').replace(/^0x/, '').toLowerCase();
  if (!/^[a-f0-9]{130}$/.test(hex)) throw new Error('Firma EVM non valida');
  const r = hex.slice(0, 64);
  const s = hex.slice(64, 128);
  let v = parseInt(hex.slice(128, 130), 16);
  if (v < 27) v += 27;
  if (![27, 28].includes(v)) throw new Error('Recovery id firma non valido');
  return { r, s, v };
}

function pad64(hex) { return String(hex).replace(/^0x/, '').padStart(64, '0'); }
function utf8Hex(value) { return Buffer.from(String(value), 'utf8').toString('hex'); }

async function recoverPersonalSignAddress(rpcUrl, message, signature) {
  const prefix = `\x19Ethereum Signed Message:\n${Buffer.byteLength(String(message), 'utf8')}${message}`;
  const hash = await rpc(rpcUrl, 'web3_sha3', [`0x${utf8Hex(prefix)}`]);
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(hash || ''))) throw new Error('Hash firma non valido dal nodo EVM');
  const { r, s, v } = signatureParts(signature);
  const data = `0x${pad64(hash)}${pad64(v.toString(16))}${r}${s}`;
  const result = await rpc(rpcUrl, 'eth_call', [{ to: '0x0000000000000000000000000000000000000001', data }, 'latest']);
  const clean = String(result || '').replace(/^0x/, '').padStart(64, '0');
  if (!/^[a-fA-F0-9]{64}$/.test(clean)) throw new Error('Recovery firma non riuscito');
  return normalizeAddress(`0x${clean.slice(-40)}`);
}

function balanceOfData(address) {
  // ERC-20 balanceOf(address) selector 0x70a08231.
  return `0x70a08231${pad64(normalizeAddress(address))}`;
}

async function erc20Balance(rpcUrl, contract, address, decimals = 18) {
  const result = await rpc(rpcUrl, 'eth_call', [{ to: normalizeAddress(contract), data: balanceOfData(address) }, 'latest']);
  if (!/^0x[a-fA-F0-9]+$/.test(String(result || ''))) throw new Error('Saldo token non valido');
  const raw = BigInt(result);
  const scale = BigInt(10) ** BigInt(decimals);
  const whole = raw / scale;
  const fraction = (raw % scale).toString().padStart(decimals, '0').replace(/0+$/, '').slice(0, 8);
  return { raw: raw.toString(), formatted: fraction ? `${whole}.${fraction}` : whole.toString() };
}

module.exports = { normalizeAddress, recoverPersonalSignAddress, erc20Balance };
