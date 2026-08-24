const http = require('http');
const { createIndependentVerifier } = require('../src/services/independentPaymentVerifier');
const { processPayment } = require('../src/services/paymentLifecycle');

function startVerifierServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        await handler({ req, res, body });
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/verify`,
      });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
}

const evidence = {
  txId: 'tx-integration-1',
  recipient: 'recipient-integration-1',
  asset: 'MYZ',
  network: 'Tari',
  amount: 25,
  issueNumber: 289,
  prNumber: 300,
};

function confirmedResponse(body, overrides = {}) {
  return {
    valid: true,
    txId: body.txId,
    recipient: body.recipient,
    asset: body.asset,
    network: body.network,
    amount: body.amount,
    transactionStatus: 'confirmed',
    checks: {
      recipient: true,
      asset: true,
      network: true,
      amount: true,
      transactionStatus: true,
    },
    provider: 'local-http-integration-verifier',
    ...overrides,
  };
}

describe('independent payment verifier HTTP integration', () => {
  test('confirms only after an independent HTTP verifier validates the exact submitted evidence', async () => {
    const observed = {};
    const { server, url } = await startVerifierServer(({ req, res, body }) => {
      observed.authorization = req.headers.authorization;
      observed.body = body;
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(confirmedResponse(body)));
    });

    try {
      const verifier = createIndependentVerifier({
        url,
        timeoutMs: 2000,
        bearerToken: 'integration-only-token',
      });
      const bounty = {
        paymentStatus: 'SUBMITTED',
        paymentTxId: evidence.txId,
        paymentRecipient: evidence.recipient,
        paymentAsset: evidence.asset,
        paymentNetwork: evidence.network,
        rewardAmount: evidence.amount,
        issueNumber: evidence.issueNumber,
        prNumber: evidence.prNumber,
      };

      const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });

      expect(result.state).toBe('CONFIRMED');
      expect(bounty.status).toBe('paid');
      expect(observed.authorization).toBe('Bearer integration-only-token');
      expect(observed.body).toEqual(evidence);
    } finally {
      await stopServer(server);
    }
  });

  test('fails closed when the HTTP verifier returns evidence for a different recipient', async () => {
    const { server, url } = await startVerifierServer(({ res, body }) => {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(confirmedResponse(body, { recipient: 'wrong-recipient' })));
    });

    try {
      const verifier = createIndependentVerifier({ url, timeoutMs: 2000 });
      const bounty = {
        paymentStatus: 'SUBMITTED',
        paymentTxId: evidence.txId,
        paymentRecipient: evidence.recipient,
        paymentAsset: evidence.asset,
        paymentNetwork: evidence.network,
        rewardAmount: evidence.amount,
        issueNumber: evidence.issueNumber,
        prNumber: evidence.prNumber,
      };

      const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });

      expect(result.state).toBe('FAILED');
      expect(bounty.status).not.toBe('paid');
    } finally {
      await stopServer(server);
    }
  });

  test('fails closed when the verifier endpoint is unavailable', async () => {
    const { server, url } = await startVerifierServer(({ res }) => {
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'unavailable' }));
    });

    try {
      const verifier = createIndependentVerifier({ url, timeoutMs: 2000 });
      const result = await verifier.verify(evidence);

      expect(result.valid).toBe(false);
      expect(result.transactionStatus).toBe('unknown');
      expect(result.reason).toContain('independent verifier request failed');
    } finally {
      await stopServer(server);
    }
  });
});
