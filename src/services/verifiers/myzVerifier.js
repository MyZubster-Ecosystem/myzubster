'use strict';

const DEFAULT_TIMEOUT_MS = 5000;

function requireVerifierUrl() {
  const url = String(process.env.MYZ_VERIFIER_URL || '').trim();
  if (!url) throw new Error('MYZ independent verifier is not configured');
  return url.replace(/\/$/, '');
}

function timeoutMs() {
  const value = Number(process.env.MYZ_VERIFIER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

function createMyzVerifier() {
  return {
    async verify(request) {
      const url = requireVerifierUrl();
      if (!request || typeof request !== 'object') throw new Error('MYZ verifier request is invalid');
      if (!request.txId) throw new Error('MYZ verifier requires txId');
      if (request.asset && request.asset !== 'MYZ') throw new Error('MYZ verifier only accepts MYZ payments');
      if (!request.recipient) throw new Error('MYZ verifier requires recipient');
      if (!request.network || typeof request.network !== 'string') throw new Error('MYZ verifier requires network');
      if (request.amount === undefined || request.amount === null) throw new Error('MYZ verifier requires amount');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs());

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txId: request.txId,
            recipient: request.recipient,
            asset: request.asset || 'MYZ',
            network: request.network,
            amount: request.amount,
            issueNumber: request.issueNumber,
            prNumber: request.prNumber
          }),
          signal: controller.signal
        });

        const body = await response.text();
        if (!response.ok) throw new Error(`MYZ verifier HTTP ${response.status}`);

        let data;
        try {
          data = body ? JSON.parse(body) : null;
        } catch (_) {
          throw new Error('MYZ verifier returned invalid JSON');
        }
        if (!data || typeof data !== 'object') throw new Error('MYZ verifier returned an invalid response');
        return data;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('MYZ verifier request timed out');
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

module.exports = { createMyzVerifier, DEFAULT_TIMEOUT_MS };
