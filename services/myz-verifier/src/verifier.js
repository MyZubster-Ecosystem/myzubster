const DEFAULT_TIMEOUT_MS = 10_000;

function fail(reason, extra = {}) {
  return { verified: false, reason, ...extra };
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function amountsEqual(expected, observed) {
  const a = normalizeAmount(expected);
  const b = normalizeAmount(observed);
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= Math.max(1e-12, Math.abs(a) * 1e-12);
}

function validateObserved({ txid, recipient, asset, network, amount, transactionStatus }, observed) {
  if (!observed || typeof observed !== 'object') return fail('invalid verifier response');
  if (observed.txid !== txid) return fail('transaction ID mismatch');
  if (observed.recipient !== recipient) return fail('recipient mismatch');
  if (observed.asset !== asset) return fail('asset mismatch');
  if (observed.network !== network) return fail('network mismatch');
  if (!amountsEqual(amount, observed.amount)) return fail('amount mismatch');
  if (observed.transactionStatus !== transactionStatus) return fail('transaction status mismatch');
  if (observed.transactionStatus !== 'confirmed') return fail('transaction is not confirmed');

  return {
    verified: true,
    txid,
    recipient,
    asset,
    network,
    amount: normalizeAmount(observed.amount),
    transactionStatus: observed.transactionStatus,
    checks: {
      txid: true,
      recipient: true,
      asset: true,
      network: true,
      amount: true,
      transactionStatus: true,
    },
  };
}

function buildIndexerUrl(baseUrl, txid) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('MYZ_TARI_INDEXER_URL must use HTTPS in production');
  }
  const trimmed = base.toString().replace(/\/$/, '');
  return `${trimmed}/transactions/${encodeURIComponent(txid)}/result`;
}

function extractTransferFromReceipt(receipt, { txid, resourceAddress, eventTopic }) {
  const finalized = receipt?.result?.Finalized;
  if (!finalized || finalized.final_decision !== 'Commit') return null;

  const executionResult = finalized.execution_result;
  const finalize = executionResult?.finalize;
  if (!finalize || finalize.transaction_hash !== txid) return null;

  const events = Array.isArray(finalize.events) ? finalize.events : [];
  const event = events.find((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    if (candidate.topic !== eventTopic) return false;
    const payload = candidate.payload;
    if (!payload || typeof payload !== 'object') return false;
    const candidateAsset = payload.asset ?? payload.resource_address ?? payload.resource;
    return candidateAsset === resourceAddress;
  });

  if (!event) return null;

  const payload = event.payload;
  return {
    txid,
    recipient: payload.recipient ?? payload.recipient_address ?? payload.to,
    asset: 'MYZ',
    amount: payload.amount ?? payload.value,
    transactionStatus: 'confirmed',
  };
}

async function fetchTariIndexerTransaction(txid, options = {}) {
  const indexerUrl = options.indexerUrl || process.env.MYZ_TARI_INDEXER_URL;
  const resourceAddress = options.resourceAddress || process.env.MYZ_TARI_RESOURCE_ADDRESS;
  const eventTopic = options.eventTopic || process.env.MYZ_TARI_EVENT_TOPIC;

  if (!indexerUrl) throw new Error('MYZ_TARI_INDEXER_URL is not configured');
  if (!resourceAddress) throw new Error('MYZ_TARI_RESOURCE_ADDRESS is not configured');
  if (!eventTopic) throw new Error('MYZ_TARI_EVENT_TOPIC is not configured');

  const url = buildIndexerUrl(indexerUrl, txid);
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || process.env.MYZ_VERIFIER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) return fail(`Tari indexer returned HTTP ${response.status}`);

    let receipt;
    try {
      receipt = await response.json();
    } catch {
      return fail('Tari indexer returned invalid JSON');
    }

    const observed = extractTransferFromReceipt(receipt, { txid, resourceAddress, eventTopic });
    if (!observed) return fail('confirmed MYZ transfer event not found in Tari receipt');
    return observed;
  } catch (error) {
    if (error && error.name === 'AbortError') return fail('Tari indexer timeout');
    return fail('Tari indexer unavailable');
  } finally {
    clearTimeout(timer);
  }
}

async function verifyMyzPayment(input, options = {}) {
  const { txid, recipient, asset, network, amount } = input || {};

  if (!txid || typeof txid !== 'string') return fail('transaction ID is required');
  if (!recipient || typeof recipient !== 'string') return fail('recipient is required');
  if (asset !== 'MYZ') return fail('MYZ verifier only accepts MYZ asset');
  if (!network || typeof network !== 'string') return fail('network is required');
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return fail('amount must be positive');

  const configuredNetwork = options.network || process.env.MYZ_TARI_NETWORK;
  if (!configuredNetwork || configuredNetwork !== network) {
    return fail('network is not configured for this verifier');
  }

  const observed = await fetchTariIndexerTransaction(txid, options);
  if (!observed || observed.verified === false) return observed;

  return validateObserved(
    { txid, recipient, asset, network, amount, transactionStatus: 'confirmed' },
    { ...observed, network },
  );
}

module.exports = {
  verifyMyzPayment,
  validateObserved,
  extractTransferFromReceipt,
  fetchTariIndexerTransaction,
};
