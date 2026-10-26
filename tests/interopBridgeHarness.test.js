'use strict';

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

  describe('canonicalize and computeDigest', () => {
    test('canonicalize sorts keys deterministically', () => {
      const objA = { z: 1, a: 2, m: { y: 10, b: 20 } };
      const objB = { a: 2, m: { b: 20, y: 10 }, z: 1 };

      expect(JSON.stringify(canonicalize(objA))).toBe(JSON.stringify(canonicalize(objB)));
    });

    test('canonicalize preserves array order and ignores undefined values', () => {
      const input = { list: [3, 1, 2], removeMe: undefined, keepMe: 'ok' };
      const res = canonicalize(input);
      expect(res.list).toEqual([3, 1, 2]);
      expect(res).not.toHaveProperty('removeMe');
      expect(res.keepMe).toBe('ok');
    });

    test('computeDigest generates identical SHA-256 regardless of key order', () => {
      const obj1 = { name: 'Wasim', repo: 'myzubster', steps: [1, 2, 3] };
      const obj2 = { repo: 'myzubster', steps: [1, 2, 3], name: 'Wasim' };

      const hash1 = computeDigest(obj1);
      const hash2 = computeDigest(obj2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    test('computeDigest changes if any field is modified', () => {
      const obj1 = { name: 'Wasim', score: 100 };
      const obj2 = { name: 'Wasim', score: 101 };

      expect(computeDigest(obj1)).not.toBe(computeDigest(obj2));
    });
  });

  describe('createBridgePayload', () => {
    test('throws error if required fields are missing', () => {
      expect(() => createBridgePayload({ displayName: 'Wasim', commitSha: sampleCommitSha })).toThrow(/contributorId/);
      expect(() => createBridgePayload({ contributorId: 'wasim-builds', commitSha: sampleCommitSha })).toThrow(/displayName/);
      expect(() => createBridgePayload({ contributorId: 'wasim-builds', displayName: 'Wasim' })).toThrow(/commitSha/);
    });

    test('builds compliant checkpoint payload with valid integrity digest', () => {
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
    });
  });

  describe('verifyBridgePayload', () => {
    test('verifies genuine, untampered payload', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'MOHAMMED WASIM KHAN',
        commitSha: sampleCommitSha,
        observation: { status: 'healthy' }
      });

      const result = verifyBridgePayload(payload);
      expect(result.valid).toBe(true);
      expect(result.digest).toBe(payload.integrity.digest);
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
      // Recalculate digest for the tampered schema to test schema guard specifically
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

    test('rejects tampered observation data', () => {
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha,
        observation: { verified: true }
      });

      // Tamper with the observation payload without updating digest
      payload.observation.verified = false;

      const result = verifyBridgePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Digest mismatch: payload has been modified or tampered with');
    });
  });

  describe('InteropBridgeDispatcher', () => {
    test('successfully dispatches valid payload to mock receiver', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 2, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const mockReceiver = jest.fn().mockResolvedValue({
        acknowledged: true,
        receipt: 'rcpt_12345'
      });

      const response = await dispatcher.dispatch(payload, mockReceiver);

      expect(response.success).toBe(true);
      expect(response.idempotent).toBe(false);
      expect(response.attempts).toBe(1);
      expect(response.record.receipt).toBe('rcpt_12345');
      expect(mockReceiver).toHaveBeenCalledTimes(1);

      const history = dispatcher.getAuditHistory();
      expect(history).toHaveLength(1);
      expect(history[0].digest).toBe(payload.integrity.digest);
    });

    test('handles idempotent replays without calling mock receiver again', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 2, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const mockReceiver = jest.fn().mockResolvedValue({ acknowledged: true, receipt: 'first' });

      // First dispatch
      const firstResult = await dispatcher.dispatch(payload, mockReceiver);
      expect(firstResult.success).toBe(true);
      expect(firstResult.idempotent).toBe(false);
      expect(mockReceiver).toHaveBeenCalledTimes(1);

      // Replay identical dispatch
      const secondResult = await dispatcher.dispatch(payload, mockReceiver);
      expect(secondResult.success).toBe(true);
      expect(secondResult.idempotent).toBe(true);
      expect(secondResult.message).toContain('idempotent replay ignored');
      expect(mockReceiver).toHaveBeenCalledTimes(1); // Receiver NOT called again
    });

    test('retries transient failures and succeeds upon recovery', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 3, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      let attempts = 0;
      const mockReceiver = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('P2P connection timeout (transient)');
        }
        return { acknowledged: true, receipt: 'rcpt_recovered' };
      });

      const response = await dispatcher.dispatch(payload, mockReceiver);

      expect(response.success).toBe(true);
      expect(response.attempts).toBe(3);
      expect(response.record.receipt).toBe('rcpt_recovered');
      expect(mockReceiver).toHaveBeenCalledTimes(3);
    });

    test('fails closed when max retries are exceeded', async () => {
      const dispatcher = new InteropBridgeDispatcher({ maxRetries: 2, retryDelayMs: 5 });
      const payload = createBridgePayload({
        contributorId: 'wasim-builds',
        displayName: 'Wasim',
        commitSha: sampleCommitSha
      });

      const mockReceiver = jest.fn().mockRejectedValue(new Error('Persistent network partition'));

      const response = await dispatcher.dispatch(payload, mockReceiver);

      expect(response.success).toBe(false);
      expect(response.code).toBe('DELIVERY_MAX_RETRIES_EXCEEDED');
      expect(response.error).toContain('Persistent network partition');
      // initial call (1) + 2 retries = 3 calls
      expect(mockReceiver).toHaveBeenCalledTimes(3);
    });

    test('fails closed immediately when payload verification fails', async () => {
      const dispatcher = new InteropBridgeDispatcher();
      const mockReceiver = jest.fn();

      const invalidPayload = { invalid: true };
      const response = await dispatcher.dispatch(invalidPayload, mockReceiver);

      expect(response.success).toBe(false);
      expect(response.code).toBe('PAYLOAD_VERIFICATION_FAILED');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
  });
});
