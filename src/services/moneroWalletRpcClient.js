'use strict';

const axios = require('axios');

function isLoopbackHostname(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]';
}

function assertRpcUrl(url, { allowRemote = false } = {}) {
  if (!url || typeof url !== 'string') throw new Error('Monero wallet RPC URL is required');
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Monero wallet RPC URL must use HTTP(S)');
  if (!allowRemote && !isLoopbackHostname(parsed.hostname)) {
    throw new Error('Monero wallet RPC must be loopback-only for the P0 stagenet adapter');
  }
  return parsed.toString();
}

function createMoneroWalletRpcClient({ url, timeoutMs = 15000, httpClient = axios, allowRemote = false } = {}) {
  const rpcUrl = assertRpcUrl(url, { allowRemote });
  if (!httpClient || typeof httpClient.post !== 'function') throw new Error('Monero wallet RPC HTTP client is invalid');

  async function call(method, params = {}) {
    const response = await httpClient.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 'myzubster-p0',
      method,
      params,
    }, {
      timeout: timeoutMs,
      headers: { 'content-type': 'application/json' },
    });

    if (response?.data?.error) {
      const error = new Error(`Monero wallet RPC ${method} failed: ${response.data.error.message || 'unknown error'}`);
      error.rpcCode = response.data.error.code;
      throw error;
    }
    if (!response?.data || typeof response.data.result !== 'object') {
      throw new Error(`Monero wallet RPC ${method} returned a malformed response`);
    }
    return response.data.result;
  }

  return {
    call,
    transfer(params) { return call('transfer', params); },
    relayTx(txMetadata) { return call('relay_tx', { hex: txMetadata }); },
    getTransferByTxId(txId) { return call('get_transfer_by_txid', { txid: txId }); },
    getTxProof({ txId, address, message }) { return call('get_tx_proof', { txid: txId, address, message }); },
    checkTxProof({ txId, address, message, signature }) {
      return call('check_tx_proof', { txid: txId, address, message, signature });
    },
  };
}

module.exports = { assertRpcUrl, createMoneroWalletRpcClient, isLoopbackHostname };
