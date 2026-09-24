'use strict';

const crypto = require('crypto');
const { SUPPORTED_ASSETS } = require('./zorgaxLegacyMonetizationService');

const DEFAULT_BTC_ESPLORA_URL = 'https://blockstream.info/api';

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateVerificationPayload(payload, expected) {
  const asset = String(payload?.asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(asset)) throw new Error('Asset non supportato');
  if (asset !== expected.asset) throw new Error('Asset pagamento non corrispondente');
  if (String(payload?.destination || '') !== String(expected.destination || '')) throw new Error('Destinazione pagamento non corrispondente');
  const paidAmount = Number(payload?.amount);
  const expectedAmount = Number(expected.cryptoAmount);
  if (!Number.isFinite(paidAmount) || paidAmount < expectedAmount) throw new Error('Importo pagamento insufficiente');
  const confirmations = Number(payload?.confirmations);
  const minConfirmations = Number(expected.minConfirmations);
  if (!Number.isInteger(confirmations) || confirmations < minConfirmations) throw new Error('Conferme blockchain insufficienti');
  const paymentReference = String(payload?.paymentReference || '').trim();
  if (!paymentReference || paymentReference.length > 180) throw new Error('Riferimento pagamento non valido');
  return {
    verified: true,
    verifier: String(payload?.verifier || `${asset.toLowerCase()}-trusted-verifier`).slice(0, 120),
    paymentReference,
    confirmations,
    amount: paidAmount
  };
}

function btcAmountToSats(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error('Importo BTC non valido');
  const [whole, fraction = ''] = text.split('.');
  const firstEight = (fraction + '00000000').slice(0, 8);
  let sats = (BigInt(whole) * 100000000n) + BigInt(firstEight || '0');
  if (fraction.length > 8 && /[1-9]/.test(fraction.slice(8))) sats += 1n;
  return sats;
}

async function verifyBitcoinWithEsplora({ paymentReference, destination, cryptoAmount, fetchImpl }) {
  const txid = String(paymentReference || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txid)) throw new Error('Riferimento pagamento BTC non valido');
  const expectedSats = btcAmountToSats(cryptoAmount);
  const baseUrl = String(process.env.ZORGAX_BTC_ESPLORA_URL || DEFAULT_BTC_ESPLORA_URL).replace(/\/+$/, '');

  const txResponse = await fetchImpl(`${baseUrl}/tx/${txid}`, { headers: { accept: 'application/json' } });
  if (!txResponse.ok) {
    if (txResponse.status === 404) throw new Error('Pagamento BTC non trovato');
    throw new Error(`Verifier BTC non disponibile (${txResponse.status})`);
  }
  const tx = await txResponse.json();
  const paidSats = (Array.isArray(tx?.vout) ? tx.vout : []).reduce((sum, output) => {
    if (String(output?.scriptpubkey_address || '') !== String(destination || '')) return sum;
    const value = Number(output?.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Output BTC non valido');
    return sum + BigInt(value);
  }, 0n);
  if (paidSats < expectedSats) throw new Error('Importo pagamento insufficiente');

  let confirmations = 0;
  if (tx?.status?.confirmed === true) {
    const blockHeight = Number(tx.status.block_height);
    if (!Number.isInteger(blockHeight) || blockHeight <= 0) throw new Error('Stato conferma BTC non valido');
    const tipResponse = await fetchImpl(`${baseUrl}/blocks/tip/height`, { headers: { accept: 'text/plain' } });
    if (!tipResponse.ok) throw new Error(`Verifier BTC non disponibile (${tipResponse.status})`);
    const tipHeight = Number(await tipResponse.text());
    if (!Number.isInteger(tipHeight) || tipHeight < blockHeight) throw new Error('Altezza blockchain BTC non valida');
    confirmations = tipHeight - blockHeight + 1;
  }

  const minConfirmations = Number(process.env.ZORGAX_BTC_MIN_CONFIRMATIONS || 1);
  const paidAmount = Number(paidSats) / 1e8;
  return validateVerificationPayload({
    asset: 'BTC',
    destination,
    amount: paidAmount,
    confirmations,
    paymentReference: txid,
    verifier: 'blockstream-esplora'
  }, {
    asset: 'BTC',
    destination,
    cryptoAmount,
    minConfirmations
  });
}

function ethAmountToWei(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error('Importo ETH non valido');
  const [whole, fraction = ''] = text.split('.');
  const firstEighteen = (fraction + '000000000000000000').slice(0, 18);
  let wei = (BigInt(whole) * 1000000000000000000n) + BigInt(firstEighteen || '0');
  if (fraction.length > 18 && /[1-9]/.test(fraction.slice(18))) wei += 1n;
  return wei;
}

async function ethRpc(fetchImpl, method, params = []) {
  const endpoint = String(process.env.ZORGAX_ETH_RPC_URL || '').trim();
  if (!endpoint) throw new Error('Verifier ETH non configurato');
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc:'2.0', id:1, method, params })
  });
  if (!response.ok) throw new Error(`Verifier ETH non disponibile (${response.status})`);
  const payload = await response.json();
  if (payload?.error) throw new Error(`Verifier ETH non disponibile: ${String(payload.error.message || payload.error.code || 'RPC error').slice(0,160)}`);
  return payload?.result;
}

async function verifyEthereumWithRpc({ paymentReference, destination, cryptoAmount, fetchImpl }) {
  const txHash = String(paymentReference || '').trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(txHash)) throw new Error('Riferimento pagamento ETH non valido');
  const configuredChainId = Number(process.env.ZORGAX_ETH_CHAIN_ID || 11155111);
  const chainIdHex = await ethRpc(fetchImpl, 'eth_chainId');
  const chainId = Number(BigInt(chainIdHex));
  if (!Number.isSafeInteger(chainId) || chainId !== configuredChainId) {
    throw new Error('Rete ETH non corrispondente alla configurazione Zorgax');
  }

  const tx = await ethRpc(fetchImpl, 'eth_getTransactionByHash', [txHash]);
  if (!tx) throw new Error('Pagamento ETH non trovato');

  if (String(tx.to || '').toLowerCase() !== String(destination || '').toLowerCase()) {
    throw new Error('Destinazione pagamento non corrispondente');
  }
  let paidWei;
  try { paidWei = BigInt(tx.value || '0x0'); }
  catch (_error) { throw new Error('Importo pagamento ETH non valido'); }
  const expectedWei = ethAmountToWei(cryptoAmount);
  if (paidWei < expectedWei) throw new Error('Importo pagamento insufficiente');

  const receipt = await ethRpc(fetchImpl, 'eth_getTransactionReceipt', [txHash]);
  if (!receipt || !receipt.blockNumber) throw new Error('Conferme blockchain insufficienti');
  if (receipt.status && String(receipt.status).toLowerCase() !== '0x1') throw new Error('Pagamento ETH fallito on-chain');

  const latestHex = await ethRpc(fetchImpl, 'eth_blockNumber');
  const latest = Number(BigInt(latestHex));
  const mined = Number(BigInt(receipt.blockNumber));
  if (!Number.isSafeInteger(latest) || !Number.isSafeInteger(mined) || latest < mined) throw new Error('Altezza blockchain ETH non valida');
  const confirmations = latest - mined + 1;
  const minConfirmations = Number(process.env.ZORGAX_ETH_MIN_CONFIRMATIONS || 1);
  if (!Number.isInteger(minConfirmations) || minConfirmations < 1) throw new Error('Configurazione conferme ETH non valida');
  if (confirmations < minConfirmations) throw new Error('Conferme blockchain insufficienti');

  return {
    verified:true,
    verifier:'ethereum-json-rpc',
    paymentReference:txHash,
    confirmations,
    amount:Number(paidWei) / 1e18
  };
}

async function verifySettlement({ asset, paymentReference, destination, cryptoAmount, fetchImpl = global.fetch }) {
  const normalizedAsset = String(asset || '').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(normalizedAsset)) throw new Error('Asset non supportato');
  if (typeof fetchImpl !== 'function') throw new Error('HTTP client non disponibile');

  const endpoint = process.env[`ZORGAX_${normalizedAsset}_VERIFIER_URL`];
  const token = process.env[`ZORGAX_${normalizedAsset}_VERIFIER_TOKEN`];
  if (!endpoint || !token) {
    if (normalizedAsset === 'BTC') {
      return verifyBitcoinWithEsplora({ paymentReference, destination, cryptoAmount, fetchImpl });
    }
    if (normalizedAsset === 'ETH') {
      return verifyEthereumWithRpc({ paymentReference, destination, cryptoAmount, fetchImpl });
    }
    throw new Error(`Verifier ${normalizedAsset} non configurato`);
  }

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ asset: normalizedAsset, paymentReference, destination, expectedAmount: cryptoAmount })
  });
  if (!response.ok) throw new Error(`Verifier ${normalizedAsset} non disponibile (${response.status})`);
  const payload = await response.json();
  if (payload?.verified !== true) throw new Error('Pagamento non verificato');
  if (payload?.requestToken && !safeEqual(payload.requestToken, token)) throw new Error('Risposta verifier non autenticata');
  const minConfirmations = Number(process.env[`ZORGAX_${normalizedAsset}_MIN_CONFIRMATIONS`] || 1);
  return validateVerificationPayload(payload, { asset: normalizedAsset, destination, cryptoAmount, minConfirmations });
}

module.exports = {
  DEFAULT_BTC_ESPLORA_URL,
  validateVerificationPayload,
  btcAmountToSats,
  ethAmountToWei,
  verifyBitcoinWithEsplora,
  verifyEthereumWithRpc,
  verifySettlement
};
