const axios = require('axios');

function required(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalize(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function parseVerification(raw, request) {
  const tx = raw?.transaction || raw?.data || raw;
  const txId = normalize(tx?.txId || tx?.tx_id || tx?.id);
  const recipient = normalize(tx?.recipient);
  const asset = normalize(tx?.asset || tx?.token || tx?.currency);
  const network = normalize(tx?.network);
  const amount = tx?.amount;
  const transactionStatus = normalize(tx?.transactionStatus || tx?.status);

  const checks = {
    recipient: recipient === normalize(request.recipient),
    asset: asset === normalize(request.asset),
    network: network === normalize(request.network),
    amount: Number(amount) === Number(request.amount),
    transactionStatus: transactionStatus === 'confirmed'
  };

  return {
    valid: Boolean(txId && txId === request.txId && Object.values(checks).every(Boolean)),
    txId,
    recipient,
    asset,
    network,
    amount,
    transactionStatus,
    checks
  };
}

function createHttpPaymentVerifier({
  baseUrl = process.env.PAYMENT_VERIFIER_URL,
  timeoutMs = Number(process.env.PAYMENT_VERIFIER_TIMEOUT_MS || 10000),
  headers = {}
} = {}) {
  if (!baseUrl) throw new Error('PAYMENT_VERIFIER_URL is required');

  const client = axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    headers: { Accept: 'application/json', ...headers }
  });

  return {
    async verify(request) {
      required(request?.txId, 'txId');
      required(request?.recipient, 'recipient');
      required(request?.asset, 'asset');
      required(request?.network, 'network');
      required(request?.amount, 'amount');

      try {
        const response = await client.get(`/transactions/${encodeURIComponent(request.txId)}`);
        return parseVerification(response.data, request);
      } catch (error) {
        return {
          valid: false,
          reason: 'independent verifier unavailable or transaction lookup failed',
          checks: {
            recipient: false,
            asset: false,
            network: false,
            amount: false,
            transactionStatus: false
          }
        };
      }
    }
  };
}

module.exports = {
  createHttpPaymentVerifier,
  parseVerification
};
