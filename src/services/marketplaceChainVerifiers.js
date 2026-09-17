const SATOSHIS_PER_BTC = 100000000;

function assertHttpsUrl(value, name) {
  let url;
  try { url = new URL(value); } catch (_) { throw new Error(`${name}_INVALID`); }
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error(`${name}_HTTPS_REQUIRED`);
  return url.toString();
}

async function jsonRpc(url, method, params, headers = {}) {
  const response = await fetch(url, { method:'POST', headers:{ 'content-type':'application/json', ...headers }, body:JSON.stringify({ jsonrpc:'2.0', id:1, method, params }), signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('RPC_HTTP_ERROR');
  const body = await response.json();
  if (body.error) throw new Error('RPC_RESPONSE_ERROR');
  return body.result;
}

async function verifyBitcoinTestnetPayment({ txid, expectedAddress, expectedAmountBtc, minConfirmations = 1 }) {
  const rpcUrl = assertHttpsUrl(process.env.BTC_TESTNET_RPC_URL || '', 'BTC_TESTNET_RPC_URL');
  const auth = process.env.BTC_TESTNET_RPC_USER ? { authorization:`Basic ${Buffer.from(`${process.env.BTC_TESTNET_RPC_USER}:${process.env.BTC_TESTNET_RPC_PASSWORD || ''}`).toString('base64')}` } : {};
  const tx = await jsonRpc(rpcUrl, 'getrawtransaction', [String(txid), true], auth);
  if (!tx || !Array.isArray(tx.vout)) return { verified:false, reason:'TX_NOT_FOUND' };
  const expectedSats = Math.round(Number(expectedAmountBtc) * SATOSHIS_PER_BTC);
  const paidSats = tx.vout.reduce((sum, output) => {
    const addresses = [output?.scriptPubKey?.address, ...(output?.scriptPubKey?.addresses || [])].filter(Boolean);
    return addresses.includes(expectedAddress) ? sum + Math.round(Number(output.value) * SATOSHIS_PER_BTC) : sum;
  }, 0);
  const confirmations = Number(tx.confirmations || 0);
  return { verified:paidSats >= expectedSats && confirmations >= minConfirmations, network:'bitcoin-testnet', txid:String(txid), expectedAddress, expectedSats, paidSats, confirmations, minConfirmations };
}

async function verifyEthereumSepoliaPayment({ txHash, expectedAddress, expectedAmountWei, minConfirmations = 1 }) {
  const rpcUrl = assertHttpsUrl(process.env.ETH_SEPOLIA_RPC_URL || '', 'ETH_SEPOLIA_RPC_URL');
  const [tx, receipt, latestHex] = await Promise.all([
    jsonRpc(rpcUrl, 'eth_getTransactionByHash', [String(txHash)]),
    jsonRpc(rpcUrl, 'eth_getTransactionReceipt', [String(txHash)]),
    jsonRpc(rpcUrl, 'eth_blockNumber', [])
  ]);
  if (!tx || !receipt) return { verified:false, reason:'TX_NOT_FOUND' };
  const successful = receipt.status === '0x1';
  const recipientMatches = String(tx.to || '').toLowerCase() === String(expectedAddress || '').toLowerCase();
  const actualWei = BigInt(tx.value || '0x0');
  const expectedWei = BigInt(String(expectedAmountWei));
  const blockNumber = Number.parseInt(receipt.blockNumber, 16);
  const latestBlock = Number.parseInt(latestHex, 16);
  const confirmations = Number.isFinite(blockNumber) && Number.isFinite(latestBlock) ? Math.max(0, latestBlock - blockNumber + 1) : 0;
  return { verified:successful && recipientMatches && actualWei >= expectedWei && confirmations >= minConfirmations, network:'sepolia', txHash:String(txHash), expectedAddress:String(expectedAddress), expectedWei:expectedWei.toString(), actualWei:actualWei.toString(), successful, recipientMatches, confirmations, minConfirmations };
}

module.exports = { verifyBitcoinTestnetPayment, verifyEthereumSepoliaPayment };
