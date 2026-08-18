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

async function verifyMyzPayment(input, options = {}) {
  const {
    txid,
    recipient,
    asset,
    network,
    amount,
  } = input || {};

  if (!txid || typeof txid !== 'string') return fail('transaction ID is required');
  if (!recipient || typeof recipient !== 'string') return fail('recipient is required');
  if (asset !== 'MYZ') return fail('MYZ verifier only accepts MYZ asset');
  if (!network || typeof network !== 'string') return fail('network is required');
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return fail('amount must be positive');

  const upstreamUrl = options.upstreamUrl || process.env.MYZ_TARI_VERIFIER_RPC_URL;
  if (!upstreamUrl) throw new Error('MYZ_TARI_VERIFIER_RPC_URL is not configured');

  let url;
  try {
    url = new URL(upstreamUrl);
    if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      throw new Error('MYZ verifier upstream must use HTTPS in production');
    }
  } catch (error) {
    throw new Error(`Invalid MYZ_TARI_VERIFIER_RPC_URL: ${error.message}`);
  }

  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || process.env.MYZ_VERIFIER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ txid }),
      signal: controller.signal,
    });

    if (!response.ok) return fail(`upstream verifier returned HTTP ${response.status}`);

    let observed;
    try {
      observed = await response.json();
    } catch {
      return fail('upstream verifier returned invalid JSON');
    }

    return validateObserved({
      txid,
      recipient,
      asset,
      network,
      amount,
      transactionStatus: 'confirmed',
    }, observed);
  } catch (error) {
    if (error && error.name === 'AbortError') return fail('upstream verifier timeout');
    return fail('upstream verifier unavailable');
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { verifyMyzPayment, validateObserved };
