jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const {
  createIndependentVerifier,
  createIndependentVerifierFromEnv,
  verifierConfigFromEnv,
} = require('../src/services/independentPaymentVerifier');
const { processPayment } = require('../src/services/paymentLifecycle');

const request = {
  txId: 'tx-123',
  recipient: 'recipient-1',
  asset: 'MYZ',
  network: 'Tari',
  amount: 25,
  issueNumber: 289,
  prNumber: 300,
};

function validProviderResponse(overrides = {}) {
  return {
    valid: true,
    txId: request.txId,
    recipient: request.recipient,
    asset: request.asset,
    network: request.network,
    amount: request.amount,
    transactionStatus: 'confirmed',
    checks: {
      recipient: true,
      asset: true,
      network: true,
      amount: true,
      transactionStatus: true,
    },
    provider: 'integration-verifier',
    ...overrides,
  };
}

describe('independent payment verifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('remains unconfigured when PAYMENT_VERIFIER_URL is absent', () => {
    expect(verifierConfigFromEnv({})).toBeNull();
    expect(createIndependentVerifierFromEnv({}, axios)).toBeNull();
  });

  test('rejects an invalid verifier timeout configuration', () => {
    expect(() => verifierConfigFromEnv({ PAYMENT_VERIFIER_URL: 'https://verifier.example.test', PAYMENT_VERIFIER_TIMEOUT_MS: '0' }))
      .toThrow('PAYMENT_VERIFIER_TIMEOUT_MS must be a positive number');
  });

  test('sends exact payment evidence to the configured verifier without exposing config secrets in the payload', async () => {
    axios.post.mockResolvedValue({ data: validProviderResponse() });
    const verifier = createIndependentVerifier({
      url: 'https://verifier.example.test/verify',
      timeoutMs: 5000,
      bearerToken: 'runtime-secret',
      httpClient: axios,
    });

    const result = await verifier.verify(request);

    expect(axios.post).toHaveBeenCalledWith(
      'https://verifier.example.test/verify',
      request,
      {
        timeout: 5000,
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer runtime-secret',
        },
      },
    );
    expect(result).toEqual(validProviderResponse());
  });

  test('fails closed on verifier network failure', async () => {
    axios.post.mockRejectedValue(new Error('timeout'));
    const verifier = createIndependentVerifier({ url: 'https://verifier.example.test/verify', httpClient: axios });

    const result = await verifier.verify(request);

    expect(result.valid).toBe(false);
    expect(result.transactionStatus).toBe('unknown');
    expect(result.reason).toContain('independent verifier request failed');
    expect(Object.values(result.checks).every(value => value === false)).toBe(true);
  });

  test('fails closed on malformed verifier response', async () => {
    axios.post.mockResolvedValue({ data: null });
    const verifier = createIndependentVerifier({ url: 'https://verifier.example.test/verify', httpClient: axios });

    const result = await verifier.verify(request);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('independent verifier returned a malformed response');
  });

  test('payment lifecycle confirms only a response bound to the exact submitted evidence', async () => {
    axios.post.mockResolvedValue({ data: validProviderResponse() });
    const verifier = createIndependentVerifier({ url: 'https://verifier.example.test/verify', httpClient: axios });
    const bounty = {
      paymentStatus: 'SUBMITTED',
      paymentTxId: request.txId,
      paymentRecipient: request.recipient,
      paymentAsset: request.asset,
      paymentNetwork: request.network,
      rewardAmount: request.amount,
      issueNumber: request.issueNumber,
      prNumber: request.prNumber,
    };

    const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });

    expect(result.state).toBe('CONFIRMED');
    expect(bounty.status).toBe('paid');
  });

  test.each([
    ['recipient', { recipient: 'other-recipient' }],
    ['asset', { asset: 'XMR' }],
    ['network', { network: 'other-network' }],
    ['amount', { amount: 26 }],
    ['transaction status', { transactionStatus: 'pending' }],
    ['transaction id', { txId: 'other-tx' }],
  ])('payment lifecycle rejects a verifier response with wrong %s', async (_label, overrides) => {
    axios.post.mockResolvedValue({ data: validProviderResponse(overrides) });
    const verifier = createIndependentVerifier({ url: 'https://verifier.example.test/verify', httpClient: axios });
    const bounty = {
      paymentStatus: 'SUBMITTED',
      paymentTxId: request.txId,
      paymentRecipient: request.recipient,
      paymentAsset: request.asset,
      paymentNetwork: request.network,
      rewardAmount: request.amount,
      issueNumber: request.issueNumber,
      prNumber: request.prNumber,
    };

    const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });

    expect(result.state).toBe('FAILED');
    expect(bounty.status).not.toBe('paid');
  });
});
