'use strict';

const crypto = require('crypto');
const {
  INTEROP_SCHEMA_V1,
  canonicalize,
  computeDigest,
  createBridgePayload,
  verifyBridgePayload,
  InteropBridgeDispatcher
} = require('../src/services/interopBridgeHarness');

describe('interopBridgeHarness (Issue #1659 — Milestone M2)', () => {
  const sampleCommitSha = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

  describe('RFC 8785 (JCS) Conformance & Canonicalization', () => {
    test('RFC 8785 Section 3.2.3: sorts integer-like keys in UTF-16 lexicographical order (bypassing V8 numeric sorting)', () => {
      // In V8, standard object enumeration orders integer keys numerically: "1", "2", "10".
      // Under RFC 8785 UTF-16 code units, "10" must precede "2" because '1' (0x31) < '2' (0x32).
      const input = { '2': 'two', '10': 'ten', '1': 'one' };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"1":"one","10":"ten","2":"two"}');
    });

    test('RFC 8785 Section 3.2.3: sorts Unicode and ASCII keys by UTF-16 code units', () => {
      // UTF-16 code unit values:
      // '\r' (0x000D = 13), '\"' (0x0022 = 34), '1' (0x0031 = 49), 'a' (0x0061 = 97),
      // 'é' (0x00E9 = 233), '€' (0x20AC = 8364)
      const input = {
        '€': 'euro',
        'é': 'e-acute',
        'a': 'letter-a',
        '1': 'digit-one',
        '"': 'quote',
        '\r': 'cr'
      };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"\\r":"cr","\\"":"quote","1":"digit-one","a":"letter-a","é":"e-acute","€":"euro"}');
    });

    test('RFC 8785 Section 3.2.2.3: normalizes -0 to 0 and formats numbers according to IEEE 754', () => {
      const input = { negZero: -0, posZero: 0, floatVal: 1.5, largeExp: 1e5 };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"floatVal":1.5,"largeExp":100000,"negZero":0,"posZero":0}');
    });

    test('RFC 8785 Section 3.2.2.2: properly escapes quotes, backslashes, and control characters U+0000..U+001F', () => {
      const input = { text: 'Line1\nLine2\t"quoted"\\backslash\0null' };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"text":"Line1\\nLine2\\t\\"quoted\\"\\\\backslash\\u0000null"}');
    });

    test('RFC 8785: preserves array element order and converts undefined array entries to null', () => {
      const input = { list: [3, 1, undefined, 2] };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"list":[3,1,null,2]}');
    });

    test('RFC 8785: ignores object properties with undefined, function, or symbol values', () => {
      const input = {
        keep: 'ok',
        dropUndef: undefined,
        dropFn: () => {},
        dropSym: Symbol('skip')
      };
      const canonical = canonicalize(input);
      expect(canonical).toBe('{"keep":"ok"}');
    });

    test('RFC 8785: throws error on lone surrogates per Section 3.2.2.2', () => {
      const loneSurrogate = '\uD800';
      expect(() => canonicalize({ invalid: loneSurrogate })).toThrow(/Lone surrogate/);
    });

    test('RFC 8785: throws error on NaN and Infinity', () => {
      expect(() => canonicalize({ badNum: NaN })).toThrow(/NaN and Infinity are not allowed/);
      expect(() => canonicalize({ badNum: Infinity })).toThrow(/NaN and Infinity are not allowed/);
    });

    test('RFC 8785: detects circular references', () => {
      const circular = { a: 1 };
      circular.self = circular;
      expect(() => canonicalize(circular)).toThrow(/Circular reference detected/);
    });

    test('computeDigest generates identical SHA-256 regardless of property declaration order', () => {
      const obj1 = { name: 'Wasim', repo: 'myzubster', steps: [1, 2, 3] };
      const obj2 = { repo: 'myzubster', steps: [1, 2, 3], name: 'Wasim' };

      const hash1 = computeDigest(obj1);
      const hash2 = computeDigest(obj2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('createBridgePayload', () => {
    test('throws error if required fields are missing', () => {
      expect(() => createBridgePayload({ displayName: 'Wasim', commitSha: sampleCommitSha })).toThrow(/contributorId/);
      expect(() => createBridgePayload({ contributorId: 'wasim-builds', commitSha: sampleCommitSha })).toThrow(/displayName/);
      expect(() => createBridgePayload({ contributorId: 'wasim-builds', displayName: 'Wasim' })).toThrow(/commitSha/);
    });

    test('builds unauthenticated mock payload with valid integrity digest', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        pullRequest: 1627,
        commitSha: sampleCommitSha,
        bridgeScope: 'seller-free-walkthrough',
        observation: {
          testSuitesPassed: 223,
          frontendSuitesPassed: 8,
          walkthroughDurationSec: 0.53
        }
      });

      expect(payload.schema).toBe(INTEROP_SCHEMA_V1);
      expect(payload.contributor.id).toBe('wasim-builds');
      expect(payload.contributor.displayName).toBe('MOHAMMED WASIM KHAN');
      expect(payload.source.repository).toBe('MyZubster-Ecosystem/myzubster');
      expect(payload.source.pullRequest).toBe(1627);
      expect(payload.source.commit).toBe(sampleCommitSha);
      expect(payload.evidenceState).toBe('VERIFIED_LOCAL');
      expect(payload.integrity).toBeDefined();
      expect(payload.integrity.algorithm).toBe('sha256');
      expect(payload.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
      expect(payload.provenance.nonce).toHaveLength(32);
      expect(payload.authentication).toBeUndefined();
    });

    test('builds authenticated payload with HMAC-SHA256 signature when authSecret is provided', () => {
      const secret = 'lab-symmetric-secret-key-42';
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        authSecret: secret,
        keyId: 'psk-test-key-1'
      });

      expect(payload.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
      expect(payload.authentication).toBeDefined();
      expect(payload.authentication.algorithm).toBe('hmac-sha256');
      expect(payload.authentication.keyId).toBe('psk-test-key-1');
      expect(payload.authentication.signature).toMatch(/^[0-9a-f]{64}$/);
    });

    test('builds authenticated payload with Ed25519 digital signature when privateKey is provided', () => {
      const { privateKey } = crypto.generateKeyPairSync('ed25519');
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        privateKey,
        keyId: 'ed25519:wasim-lab-key'
      });

      expect(payload.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
      expect(payload.authentication).toBeDefined();
      expect(payload.authentication.algorithm).toBe('ed25519');
      expect(payload.authentication.keyId).toBe('ed25519:wasim-lab-key');
      expect(payload.authentication.signature).toMatch(/^[0-9a-f]{128}$/);
    });
  });

  describe('verifyBridgePayload & Authenticity Boundaries', () => {
    test('unauthenticated payload validates accidental integrity but flags unauthenticated-mock mode', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        observation: { status: 'healthy' }
      });

      const result = verifyBridgePayload(payload);
      expect(result.valid).toBe(true);
      expect(result.authenticated).toBe(false);
      expect(result.mode).toBe('unauthenticated-mock-integrity-only');
      expect(result.warning).toContain('Unkeyed digest only guarantees accidental corruption detection');
      expect(result.digest).toBe(payload.integrity.digest);
    });

    test('rejects unauthenticated payload when requireAuth: true is enforced', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha
      });

      const result = verifyBridgePayload(payload, { requireAuth: true });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cryptographic authentication required');
    });

    test('successfully verifies HMAC-SHA256 authenticated payload with correct secret', () => {
      const secret = 'shared-secret-lab-777';
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        authSecret: secret,
        keyId: 'psk-777'
      });

      const result = verifyBridgePayload(payload, { authSecret: secret, requireAuth: true });
      expect(result.valid).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.authAlgorithm).toBe('hmac-sha256');
      expect(result.keyId).toBe('psk-777');
    });

    test('rejects HMAC-SHA256 payload when secret is incorrect', () => {
      const secret = 'shared-secret-lab-777';
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        authSecret: secret
      });

      const result = verifyBridgePayload(payload, { authSecret: 'wrong-secret' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('HMAC signature mismatch');
    });

    test('successfully verifies Ed25519 authenticated payload with matching public key', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        privateKey,
        keyId: 'ed25519-primary'
      });

      const result = verifyBridgePayload(payload, { publicKey, requireAuth: true });
      expect(result.valid).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.authAlgorithm).toBe('ed25519');
      expect(result.keyId).toBe('ed25519-primary');
    });

    test('rejects Ed25519 payload when public key belongs to a different identity', () => {
      const { privateKey } = crypto.generateKeyPairSync('ed25519');
      const otherPair = crypto.generateKeyPairSync('ed25519');
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        privateKey
      });

      const result = verifyBridgePayload(payload, { publicKey: otherPair.publicKey });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Ed25519 signature mismatch');
    });

    test('tamper detection: stripping or forging unkeyed digest allows accidental integrity spoof, but fails Ed25519 signature check', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        privateKey
      });

      // Attacker tampers with contributor displayName and recomputes the SHA-256 digest
      payload.contributor.displayName = 'Attacker Impersonator';
      const { integrity, authentication, ...body } = payload;
      payload.integrity.digest = computeDigest(body);

      // If attacker strips the authentication block, an unauthenticated receiver only sees accidental integrity:
      const tamperedUnauth = { ...payload };
      delete tamperedUnauth.authentication;
      const unauthResult = verifyBridgePayload(tamperedUnauth);
      expect(unauthResult.valid).toBe(true);
      expect(unauthResult.authenticated).toBe(false);
      expect(unauthResult.mode).toBe('unauthenticated-mock-integrity-only');

      // BUT when requireAuth: true is enforced, stripped unauthenticated payload is rejected:
      const enforceResult = verifyBridgePayload(tamperedUnauth, { requireAuth: true });
      expect(enforceResult.valid).toBe(false);
      expect(enforceResult.reason).toContain('Cryptographic authentication required');

      // And when the attacker attempts to pass the tampered payload with original signature:
      const authResult = verifyBridgePayload(payload, { publicKey, requireAuth: true });
      expect(authResult.valid).toBe(false);
      expect(authResult.reason).toContain('Ed25519 signature mismatch');
    });

    test('rejects non-object or null input', () => {
      expect(verifyBridgePayload(null).valid).toBe(false);
      expect(verifyBridgePayload('not-an-object').valid).toBe(false);
    });

    test('rejects missing or malformed integrity digest', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });
      delete payload.integrity;
      expect(verifyBridgePayload(payload)).toEqual({
        valid: false,
        reason: 'Missing or malformed integrity digest'
      });
    });

    test('rejects unsupported schema version', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });
      payload.schema = 'myzubster.v999.invalid';
      const { integrity, ...body } = payload;
      payload.integrity.digest = computeDigest(body);

      const result = verifyBridgePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unsupported schema version');
    });

    test('rejects invalid commit SHA format', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });
      payload.source.commit = 'invalid-sha';
      const { integrity, ...body } = payload;
      payload.integrity.digest = computeDigest(body);

      const result = verifyBridgePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid or missing source commit hash');
    });
  });

  describe('InteropBridgeDispatcher', () => {
    test('successfully dispatches valid authenticated payload to mock receiver', () => {
      const secret = 'test-secret';
      const dispatcher = new InteropBridgeDispatcher({ requireAuth: true, authSecret: secret });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha,
        authSecret: secret
      });

      const mockReceiver = jest.fn().mockResolvedValue({ acknowledged: true, receipt: 'rcpt_001' });

      return dispatcher.dispatch(payload, mockReceiver).then(result => {
        expect(result.success).toBe(true);
        expect(result.authenticated).toBe(true);
        expect(result.record.receipt).toBe('rcpt_001');
        expect(mockReceiver).toHaveBeenCalledTimes(1);
      });
    });

    test('handles idempotent replays without calling mock receiver again', async () => {
      const dispatcher = new InteropBridgeDispatcher();
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const mockReceiver = jest.fn().mockResolvedValue({ acknowledged: true });

      const first = await dispatcher.dispatch(payload, mockReceiver);
      expect(first.success).toBe(true);
      expect(first.idempotent).toBe(false);

      const second = await dispatcher.dispatch(payload, mockReceiver);
      expect(second.success).toBe(true);
      expect(second.idempotent).toBe(true);
      expect(second.message).toContain('idempotent replay');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
    });

    test('retries transient failures and succeeds upon recovery', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 3, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      let callCount = 0;
      const transientMockReceiver = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Simulated network blip'));
        }
        return Promise.resolve({ acknowledged: true, receipt: 'recovered' });
      });

      const result = await dispatcher.dispatch(payload, transientMockReceiver);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.record.receipt).toBe('recovered');
    });

    test('fails closed when max retries are exceeded', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 2, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const failingMockReceiver = jest.fn().mockRejectedValue(new Error('Permanent connection failure'));

      const result = await dispatcher.dispatch(payload, failingMockReceiver);
      expect(result.success).toBe(false);
      expect(result.code).toBe('DELIVERY_MAX_RETRIES_EXCEEDED');
      expect(result.error).toContain('failed after 2 retries');
    });

    test('fails closed immediately when payload verification fails', async () => {
      const dispatcher = new InteropBridgeDispatcher({ requireAuth: true });
      const unauthPayload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const mockReceiver = jest.fn();
      const result = await dispatcher.dispatch(unauthPayload, mockReceiver);

      expect(result.success).toBe(false);
      expect(result.code).toBe('PAYLOAD_VERIFICATION_FAILED');
      expect(mockReceiver).not.toHaveBeenCalled();
    });

    test('enforces cryptographic authentication and fails closed in production runtime even when requireAuth is false', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const payload = createBridgePayload({
          contributorId: 'wasim-builds',
          displayName: 'Wasim',
          commitSha: sampleCommitSha
        });
        const result = verifyBridgePayload(payload, { requireAuth: false });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('mock-only mode requireAuth=false fails closed in production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
