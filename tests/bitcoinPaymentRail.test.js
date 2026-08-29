const {
  createBitcoinPaymentRail,
  isBitcoinRailEnabled,
  normalizeTxId,
  normalizeVerificationPayload,
  requireSatoshis,
  trustedServiceUrl,
  validateBitcoinDestination
} = require('../src/services/bitcoinPaymentRail');

const VALID_TX =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('bitcoinPaymentRail', () => {
  test('is disabled by default', () => {
    expect(isBitcoinRailEnabled({})).toBe(false);
  });

  test('only explicit true enables the rail', () => {
    expect(
      isBitcoinRailEnabled({
        MYZUBSTER_BTC_ENABLED: 'true'
      })
    ).toBe(true);

    expect(
      isBitcoinRailEnabled({
        MYZUBSTER_BTC_ENABLED: 'false'
      })
    ).toBe(false);
  });

  test('rejects non-HTTPS service URLs in production', () => {
    expect(() =>
      trustedServiceUrl('http://example.com')
    ).toThrow('service URL must use HTTPS');

    expect(
      trustedServiceUrl('https://example.com').protocol
    ).toBe('https:');
  });

  test('allows localhost HTTP only when explicitly requested', () => {
    const url = trustedServiceUrl(
      'http://localhost:3000',
      {
        allowHttpLocalhost: true
      }
    );

    expect(url.hostname).toBe('localhost');
  });

  test('rejects credentials embedded in service URLs', () => {
    expect(() =>
      trustedServiceUrl(
        'https://user:password@example.com'
      )
    ).toThrow(
      'service URL must not contain credentials'
    );
  });

  test('requires integer satoshis', () => {
    expect(requireSatoshis(25000)).toBe(25000);

    expect(() =>
      requireSatoshis(0)
    ).toThrow();

    expect(() =>
      requireSatoshis(1.5)
    ).toThrow();

    expect(() =>
      requireSatoshis(Number.MAX_SAFE_INTEGER + 1)
    ).toThrow();
  });

  test('normalizes and validates transaction IDs', () => {
    expect(
      normalizeTxId(VALID_TX.toUpperCase())
    ).toBe(VALID_TX);

    expect(() =>
      normalizeTxId('not-a-tx')
    ).toThrow('invalid bitcoin transaction id');
  });

  test('accepts basic Bitcoin destination formats', () => {
    expect(
      validateBitcoinDestination(
        'bc1qexampledestination000000000000000000000'
      )
    ).toBe(
      'bc1qexampledestination000000000000000000000'
    );

    expect(() =>
      validateBitcoinDestination('')
    ).toThrow('bitcoin destination is required');
  });

  test('allocator refuses to run while rail is disabled', async () => {
    const http = {
      post: jest.fn()
    };

    const rail = createBitcoinPaymentRail({
      http,
      env: {}
    });

    await expect(
      rail.allocate({
        intentId: 'intent-1',
        paymentReference: 'ref-1',
        network: 'bitcoin',
        amountMinor: 25000
      })
    ).rejects.toThrow(
      'bitcoin payment rail is disabled'
    );

    expect(http.post).not.toHaveBeenCalled();
  });

  test('allocator requests a per-intent destination from trusted boundary', async () => {
    const http = {
      post: jest.fn().mockResolvedValue({
        data: {
          destination:
            'bc1qallocateddestination000000000000000000'
        }
      })
    };

    const env = {
      MYZUBSTER_BTC_ENABLED: 'true',
      MYZUBSTER_BTC_ALLOCATOR_URL:
        'https://bitcoin.internal.example/allocate',
      MYZUBSTER_BTC_VERIFIER_URL:
        'https://bitcoin.internal.example/',
      MYZUBSTER_BTC_SERVICE_TOKEN:
        'test-secret',
      NODE_ENV: 'production'
    };

    const rail = createBitcoinPaymentRail({
      http,
      env
    });

    const result = await rail.allocate({
      intentId: 'intent-123',
      paymentReference: 'reference-123',
      network: 'bitcoin',
      amountMinor: 25000
    });

    expect(result.destination).toBe(
      'bc1qallocateddestination000000000000000000'
    );

    expect(http.post).toHaveBeenCalledTimes(1);

    expect(http.post).toHaveBeenCalledWith(
      'https://bitcoin.internal.example/allocate',
      {
        intentId: 'intent-123',
        paymentReference: 'reference-123',
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 25000
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-secret'
        })
      })
    );
  });

  test('verification binds tx, destination, reference and satoshi amount', () => {
    const result = normalizeVerificationPayload(
      {
        verified: true,
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        amountMinor: 30000,
        confirmations: 2
      },
      {
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        network: 'bitcoin',
        amountMinor: 25000,
        minimumConfirmations: 1
      }
    );

    expect(result.verified).toBe(true);
    expect(result.confirmed).toBe(true);
    expect(result.amountMinor).toBe(30000);
  });

  test('verification fails when payment reference does not match', () => {
    const result = normalizeVerificationPayload(
      {
        verified: true,
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'wrong-reference',
        amountMinor: 25000,
        confirmations: 1
      },
      {
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        network: 'bitcoin',
        amountMinor: 25000,
        minimumConfirmations: 1
      }
    );

    expect(result.verified).toBe(false);
    expect(result.confirmed).toBe(false);
  });

  test('verification fails when amount is below the intent amount', () => {
    const result = normalizeVerificationPayload(
      {
        verified: true,
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        amountMinor: 24999,
        confirmations: 1
      },
      {
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        network: 'bitcoin',
        amountMinor: 25000,
        minimumConfirmations: 1
      }
    );

    expect(result.verified).toBe(false);
    expect(result.confirmed).toBe(false);
  });

  test('verification fails without enough confirmations', () => {
    const result = normalizeVerificationPayload(
      {
        verified: true,
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        amountMinor: 25000,
        confirmations: 0
      },
      {
        txId: VALID_TX,
        destination:
          'bc1qverificationdestination0000000000000000',
        paymentReference: 'reference-123',
        network: 'bitcoin',
        amountMinor: 25000,
        minimumConfirmations: 1
      }
    );

    expect(result.verified).toBe(false);
    expect(result.confirmed).toBe(false);
  });

  test('verifier calls trusted service and returns normalized verification', async () => {
    const http = {
      get: jest.fn().mockResolvedValue({
        data: {
          verified: true,
          txId: VALID_TX,
          destination:
            'bc1qverifieddestination000000000000000000',
          paymentReference: 'reference-xyz',
          amountMinor: 50000,
          confirmations: 3
        }
      })
    };

    const env = {
      MYZUBSTER_BTC_ENABLED: 'true',
      MYZUBSTER_BTC_ALLOCATOR_URL:
        'https://bitcoin.internal.example/allocate',
      MYZUBSTER_BTC_VERIFIER_URL:
        'https://bitcoin.internal.example/',
      MYZUBSTER_BTC_SERVICE_TOKEN:
        'test-secret',
      NODE_ENV: 'production'
    };

    const rail = createBitcoinPaymentRail({
      http,
      env
    });

    const result = await rail.verify({
      txId: VALID_TX,
      destination:
        'bc1qverifieddestination000000000000000000',
      paymentReference: 'reference-xyz',
      network: 'bitcoin',
      amountMinor: 50000,
      minimumConfirmations: 1
    });

    expect(result.verified).toBe(true);
    expect(result.confirmed).toBe(true);
    expect(result.asset).toBe('BTC');

    expect(http.get).toHaveBeenCalledTimes(1);
  });
});