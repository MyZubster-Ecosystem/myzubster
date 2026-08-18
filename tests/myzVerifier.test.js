'use strict';

const { createMyzVerifier } = require('../src/services/verifiers/myzVerifier');

describe('MYZ independent verifier', () => {
  const originalUrl = process.env.MYZ_VERIFIER_URL;
  const originalTimeout = process.env.MYZ_VERIFIER_TIMEOUT_MS;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.MYZ_VERIFIER_URL;
    else process.env.MYZ_VERIFIER_URL = originalUrl;
    if (originalTimeout === undefined) delete process.env.MYZ_VERIFIER_TIMEOUT_MS;
    else process.env.MYZ_VERIFIER_TIMEOUT_MS = originalTimeout;
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test('fails closed when the independent verifier is not configured', async () => {
    delete process.env.MYZ_VERIFIER_URL;
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ independent verifier is not configured');
  });

  test('requires recipient, Tari network and amount', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    await expect(createMyzVerifier().verify({ txId: 'tx-1', asset: 'MYZ', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ verifier requires recipient');
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'recipient', asset: 'MYZ', network: 'XMR', amount: 10 }))
      .rejects.toThrow('MYZ verifier requires Tari network');
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'recipient', asset: 'MYZ', network: 'Tari' }))
      .rejects.toThrow('MYZ verifier requires amount');
  });

  test('submits the exact payment facts to the independent verifier', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    const verification = {
      valid: true,
      txId: 'tx-1',
      recipient: 'myz-recipient',
      asset: 'MYZ',
      network: 'Tari',
      amount: 10,
      transactionStatus: 'confirmed',
      checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true }
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(verification) });

    const result = await createMyzVerifier().verify({
      txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10,
      issueNumber: 289, prNumber: 300
    });

    expect(result).toEqual(verification);
    expect(global.fetch).toHaveBeenCalledWith('http://verifier.test/verify', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10, issueNumber: 289, prNumber: 300 })
    }));
  });

  test('rejects malformed verifier responses', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{not-json}' });
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ verifier returned invalid JSON');
  });

  test('rejects non-success HTTP responses', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'unavailable' });
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ verifier HTTP 503');
  });

  test('times out the independent verifier request', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    process.env.MYZ_VERIFIER_TIMEOUT_MS = '10';
    global.fetch = jest.fn().mockImplementation(({ signal }) => new Promise((resolve, reject) => {
      if (signal.aborted) reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      else signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));

    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'myz-recipient', asset: 'MYZ', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ verifier request timed out');
  });

  test('rejects non-MYZ requests', async () => {
    process.env.MYZ_VERIFIER_URL = 'http://verifier.test/verify';
    await expect(createMyzVerifier().verify({ txId: 'tx-1', recipient: 'recipient', asset: 'XMR', network: 'Tari', amount: 10 }))
      .rejects.toThrow('MYZ verifier only accepts MYZ payments');
  });
});
