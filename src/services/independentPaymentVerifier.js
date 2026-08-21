const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 10000;

function verifierConfigFromEnv(env = process.env) {
  const url = env.PAYMENT_VERIFIER_URL?.trim();
  if (!url) return null;

  const parsedTimeout = Number(env.PAYMENT_VERIFIER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    throw new Error('PAYMENT_VERIFIER_TIMEOUT_MS must be a positive number');
  }

  return {
    url,
    timeoutMs: parsedTimeout,
    bearerToken: env.PAYMENT_VERIFIER_BEARER_TOKEN?.trim() || null,
  };
}

function negativeVerification(request, reason) {
  return {
    valid: false,
    txId: request.txId,
    recipient: request.recipient,
    asset: request.asset,
    network: request.network,
    amount: request.amount,
    transactionStatus: 'unknown',
    checks: {
      recipient: false,
      asset: false,
      network: false,
      amount: false,
      transactionStatus: false,
    },
    reason,
  };
}

function createIndependentVerifier({ url, timeoutMs = DEFAULT_TIMEOUT_MS, bearerToken = null, httpClient = axios }) {
  if (!url || typeof url !== 'string') throw new Error('independent verifier URL is required');
  if (!httpClient || typeof httpClient.post !== 'function') throw new Error('independent verifier HTTP client is invalid');

  return {
    async verify(request) {
      if (!request?.txId) return negativeVerification(request || {}, 'transaction ID is required');

      const headers = { 'content-type': 'application/json' };
      if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;

      try {
        const response = await httpClient.post(url, request, { timeout: timeoutMs, headers });
        const data = response?.data;
        if (!data || typeof data !== 'object') {
          return negativeVerification(request, 'independent verifier returned a malformed response');
        }

        return {
          valid: data.valid === true,
          txId: data.txId,
          recipient: data.recipient,
          asset: data.asset,
          network: data.network,
          amount: data.amount,
          transactionStatus: data.transactionStatus,
          checks: {
            recipient: data.checks?.recipient === true,
            asset: data.checks?.asset === true,
            network: data.checks?.network === true,
            amount: data.checks?.amount === true,
            transactionStatus: data.checks?.transactionStatus === true,
          },
          reason: data.reason,
          provider: data.provider,
        };
      } catch (error) {
        return negativeVerification(request, `independent verifier request failed: ${error.message}`);
      }
    },
  };
}

function createIndependentVerifierFromEnv(env = process.env, httpClient = axios) {
  const config = verifierConfigFromEnv(env);
  if (!config) return null;
  return createIndependentVerifier({ ...config, httpClient });
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  createIndependentVerifier,
  createIndependentVerifierFromEnv,
  negativeVerification,
  verifierConfigFromEnv,
};
