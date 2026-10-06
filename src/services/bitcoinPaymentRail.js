const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 10000;

function isBitcoinRailEnabled(env = process.env) {
  return String(env.MYZUBSTER_BTC_ENABLED || '')
    .trim()
    .toLowerCase() === 'true';
}

function requireBitcoinRailEnabled(env = process.env) {
  if (!isBitcoinRailEnabled(env)) {
    throw new Error('bitcoin payment rail is disabled');
  }
}

function trustedServiceUrl(value, {
  allowHttpLocalhost = false
} = {}) {
  if (!value) {
    throw new Error('service URL is required');
  }

  let url;

  try {
    url = new URL(String(value));
  } catch {
    throw new Error('invalid service URL');
  }

  if (url.username || url.password) {
    throw new Error('service URL must not contain credentials');
  }

  const hostname = url.hostname.toLowerCase();

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  if (url.protocol === 'https:') {
    return url;
  }

  if (
    allowHttpLocalhost &&
    url.protocol === 'http:' &&
    isLocalhost
  ) {
    return url;
  }

  throw new Error(
    'service URL must use HTTPS'
  );
}

function allocatorEndpoint(env = process.env) {
  return trustedServiceUrl(
    env.MYZUBSTER_BTC_ALLOCATOR_URL,
    {
      allowHttpLocalhost:
        String(env.NODE_ENV || '') !== 'production'
    }
  );
}

function verifierEndpoint(env = process.env) {
  return trustedServiceUrl(
    env.MYZUBSTER_BTC_VERIFIER_URL,
    {
      allowHttpLocalhost:
        String(env.NODE_ENV || '') !== 'production'
    }
  );
}

function requireServiceToken(env = process.env) {
  const token = String(
    env.MYZUBSTER_BTC_SERVICE_TOKEN || ''
  ).trim();

  if (!token) {
    throw new Error(
      'MYZUBSTER_BTC_SERVICE_TOKEN is required'
    );
  }

  return token;
}

function normalizeTxId(value) {
  const txId = String(value || '').trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(txId)) {
    throw new Error('invalid bitcoin transaction id');
  }

  return txId;
}

function validateBitcoinDestination(value) {
  const destination = String(value || '').trim();

  if (!destination) {
    throw new Error('bitcoin destination is required');
  }

  const lower = destination.toLowerCase();

  const looksLikeBech32 =
    lower.startsWith('bc1') ||
    lower.startsWith('tb1') ||
    lower.startsWith('bcrt1');

  const looksLikeLegacy =
    /^[123mn2][a-km-zA-HJ-NP-Z1-9]{20,70}$/.test(
      destination
    );

  if (!looksLikeBech32 && !looksLikeLegacy) {
    throw new Error('invalid bitcoin destination');
  }

  return destination;
}

function requireSatoshis(value, field = 'amountMinor') {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      `${field} must be a positive safe integer`
    );
  }

  return value;
}

function normalizeVerificationPayload(payload, expected) {
  const data = payload || {};

  const txId = normalizeTxId(data.txId);
  const destination = validateBitcoinDestination(
    data.destination
  );

  const amountMinor = requireSatoshis(
    data.amountMinor,
    'verification amountMinor'
  );

  const confirmations = Number(data.confirmations);

  if (
    !Number.isSafeInteger(confirmations) ||
    confirmations < 0
  ) {
    throw new Error(
      'verification confirmations must be a non-negative safe integer'
    );
  }

  const minimumConfirmations =
    Number.isSafeInteger(expected.minimumConfirmations) &&
    expected.minimumConfirmations >= 0
      ? expected.minimumConfirmations
      : 1;

  const reference = String(
    data.paymentReference || ''
  ).trim();

  const expectedReference = String(
    expected.paymentReference || ''
  ).trim();

  const verified =
    data.verified === true &&
    txId === expected.txId &&
    destination === expected.destination &&
    reference === expectedReference &&
    amountMinor >= expected.amountMinor &&
    confirmations >= minimumConfirmations;

  return {
    verified,
    confirmed:
      verified &&
      confirmations >= minimumConfirmations,
    txId,
    destination,
    asset: 'BTC',
    network: expected.network,
    amountMinor,
    confirmations,
    paymentReference: reference
  };
}

function createBitcoinPaymentRail({
  http = axios,
  env = process.env,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  async function allocate({
    intentId,
    paymentReference,
    network = 'bitcoin',
    amountMinor
  }) {
    requireBitcoinRailEnabled(env);

    if (!intentId) {
      throw new Error('intentId is required');
    }

    if (!paymentReference) {
      throw new Error('paymentReference is required');
    }

    requireSatoshis(amountMinor);

    const url = allocatorEndpoint(env);
    const token = requireServiceToken(env);

    const response = await http.post(
      url.toString(),
      {
        intentId: String(intentId),
        paymentReference: String(paymentReference),
        asset: 'BTC',
        network: String(network),
        amountMinor
      },
      {
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const destination =
      validateBitcoinDestination(
        response?.data?.destination
      );

    return {
      destination,
      asset: 'BTC',
      network: String(network),
      amountMinor,
      paymentReference: String(paymentReference)
    };
  }

  async function verify({
    txId,
    destination,
    paymentReference,
    network = 'bitcoin',
    amountMinor,
    minimumConfirmations = 1
  }) {
    requireBitcoinRailEnabled(env);

    const normalizedTxId = normalizeTxId(txId);
    const normalizedDestination =
      validateBitcoinDestination(destination);

    requireSatoshis(amountMinor);

    if (!paymentReference) {
      throw new Error('paymentReference is required');
    }

    if (
      !Number.isSafeInteger(minimumConfirmations) ||
      minimumConfirmations < 0
    ) {
      throw new Error(
        'minimumConfirmations must be a non-negative safe integer'
      );
    }

    const baseUrl = verifierEndpoint(env);
    const token = requireServiceToken(env);

    const url = new URL(
      `transactions/${normalizedTxId}`,
      baseUrl.toString().endsWith('/')
        ? baseUrl
        : `${baseUrl.toString()}/`
    );

    const response = await http.get(
      url.toString(),
      {
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    return normalizeVerificationPayload(
      response?.data,
      {
        txId: normalizedTxId,
        destination: normalizedDestination,
        paymentReference: String(paymentReference),
        network: String(network),
        amountMinor,
        minimumConfirmations
      }
    );
  }

  return {
    allocate,
    verify
  };
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  allocatorEndpoint,
  createBitcoinPaymentRail,
  isBitcoinRailEnabled,
  normalizeTxId,
  normalizeVerificationPayload,
  requireBitcoinRailEnabled,
  requireSatoshis,
  trustedServiceUrl,
  validateBitcoinDestination,
  verifierEndpoint
};