const axios = require('axios');

const DEFAULT_CONFIRMATIONS = 10;
const XMR_ATOMIC_UNITS = 1e12;

function nearlyEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) <= 1e-12;
}

async function verifyXmrPayment({ txid, address, amount, currency }) {
  if (currency !== 'XMR') {
    throw new Error('XMR verifier only accepts XMR payments');
  }
  if (!txid || !/^[0-9a-f]{64}$/i.test(txid)) {
    throw new Error('Invalid XMR transaction ID');
  }
  if (!address) {
    throw new Error('XMR recipient address is required for verification');
  }

  const url = process.env.XMR_WALLET_RPC_URL;
  if (!url) {
    throw new Error('XMR_WALLET_RPC_URL is not configured');
  }

  const response = await axios.post(
    url,
    {
      jsonrpc: '2.0',
      id: 'myzubster-payment-verifier',
      method: 'get_transfer_by_txid',
      params: { txid },
    },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
      auth: process.env.XMR_WALLET_RPC_USER
        ? {
            username: process.env.XMR_WALLET_RPC_USER,
            password: process.env.XMR_WALLET_RPC_PASSWORD || '',
          }
        : undefined,
    }
  );

  const result = response.data && response.data.result;
  const transfer = result && result.transfer;
  if (!transfer || transfer.txid !== txid) {
    return { verified: false, reason: 'transaction not found' };
  }

  const confirmations = Number(transfer.confirmations || 0);
  const requiredConfirmations = Number(process.env.XMR_REQUIRED_CONFIRMATIONS || DEFAULT_CONFIRMATIONS);
  if (!Number.isFinite(confirmations) || confirmations < requiredConfirmations) {
    return { verified: false, confirmations, reason: 'insufficient confirmations' };
  }

  if (transfer.address && transfer.address !== address) {
    return { verified: false, confirmations, reason: 'recipient mismatch' };
  }

  const observedAmount = Number(transfer.amount) / XMR_ATOMIC_UNITS;
  if (!Number.isFinite(observedAmount) || !nearlyEqual(observedAmount, amount)) {
    return { verified: false, confirmations, reason: 'amount mismatch' };
  }

  if (transfer.type && !['out', 'pending'].includes(transfer.type)) {
    return { verified: false, confirmations, reason: 'unexpected transfer type' };
  }

  return {
    verified: true,
    confirmations,
    txid,
    address: transfer.address || address,
    amount: observedAmount,
  };
}

module.exports = { verifyXmrPayment };
