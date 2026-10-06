const crypto = require('crypto');
const {
  EVENT_TYPES,
  PaymentWebhookDispatcher,
  PaymentWebhookVerifier,
} = require('../backend/src/services/paymentWebhooks');

function createDispatcher(overrides = {}) {
  return new PaymentWebhookDispatcher({
    endpoints: ['https://example.test/webhooks'],
    secret: 'test-secret',
    request: jest.fn().mockResolvedValue({ status: 204 }),
    sleep: jest.fn().mockResolvedValue(undefined),
    now: () => '2026-09-01T01:00:00.000Z',
    idFactory: () => 'delivery-123',
    ...overrides,
  });
}

test('sends a signed payment confirmation event', async () => {
  const dispatcher = createDispatcher();
  const result = await dispatcher.paymentConfirmed({ paymentId: 'p-1', amount: 2, currency: 'XMR' });

  expect(result.deliveries).toEqual([
    { endpoint: 'https://example.test/webhooks', delivered: true, attempts: 1 },
  ]);
  const [url, event, config] = dispatcher.request.mock.calls[0];
  expect(url).toBe('https://example.test/webhooks');
  expect(event).toEqual({
    id: 'delivery-123',
    type: EVENT_TYPES.PAYMENT_CONFIRMED,
    createdAt: '2026-09-01T01:00:00.000Z',
    data: { paymentId: 'p-1', amount: 2, currency: 'XMR' },
  });
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', 'test-secret')
    .update(JSON.stringify(event))
    .digest('hex')}`;
  expect(config.headers['x-myzubster-signature-256']).toBe(expectedSignature);
  expect(config.headers['x-myzubster-delivery']).toBe('delivery-123');
});

test('retries a network failure without changing the delivery id', async () => {
  const request = jest.fn()
    .mockRejectedValueOnce(new Error('temporary failure'))
    .mockResolvedValueOnce({ status: 204 });
  const dispatcher = createDispatcher({ request });

  const result = await dispatcher.escrowReleased({ escrowId: 'e-1' });

  expect(result.deliveries[0]).toEqual({
    endpoint: 'https://example.test/webhooks',
    delivered: true,
    attempts: 2,
  });
  expect(dispatcher.sleep).toHaveBeenCalledWith(100);
  expect(request.mock.calls[0][1].id).toBe(request.mock.calls[1][1].id);
});

test('does not retry a permanent 4xx response', async () => {
  const error = Object.assign(new Error('bad request'), { response: { status: 400 } });
  const dispatcher = createDispatcher({ request: jest.fn().mockRejectedValue(error) });

  const result = await dispatcher.paymentConfirmed({ paymentId: 'p-1' });

  expect(result.deliveries[0]).toEqual({
    endpoint: 'https://example.test/webhooks',
    delivered: false,
    attempts: 1,
    error: 'bad request',
  });
  expect(dispatcher.sleep).not.toHaveBeenCalled();
});

test('retries a transient 429 response', async () => {
  const error = Object.assign(new Error('rate limited'), { response: { status: 429 } });
  const request = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce({ status: 204 });
  const dispatcher = createDispatcher({ request });

  const result = await dispatcher.paymentConfirmed({ paymentId: 'p-1' });

  expect(result.deliveries[0].attempts).toBe(2);
  expect(dispatcher.sleep).toHaveBeenCalledWith(100);
});

test('reports a failed endpoint after exhausting retries', async () => {
  const dispatcher = createDispatcher({
    maxAttempts: 2,
    request: jest.fn().mockRejectedValue(new Error('offline')),
  });

  const result = await dispatcher.bountyCompleted({ issueId: 307 });

  expect(result.deliveries[0]).toEqual({
    endpoint: 'https://example.test/webhooks',
    delivered: false,
    attempts: 2,
    error: 'offline',
  });
});

test('validates event names even when no endpoints are configured', async () => {
  const dispatcher = createDispatcher({ endpoints: [] });
  await expect(dispatcher.emit('payment.unknown', {})).rejects.toThrow('Unsupported payment webhook event');
});

test('refuses unsigned configured webhook endpoints', () => {
  expect(() => new PaymentWebhookDispatcher({
    endpoints: ['https://example.test/webhooks'],
    secret: '',
  })).toThrow('PAYMENT_WEBHOOK_SECRET is required');
});

test('receiver verifies the signature, timestamp, and delivery id exactly once', async () => {
  const event = {
    id: 'delivery-123',
    type: EVENT_TYPES.PAYMENT_CONFIRMED,
    createdAt: '2026-09-01T01:00:00.000Z',
    data: { paymentId: 'p-1' },
  };
  const rawBody = JSON.stringify(event);
  const signature = `sha256=${crypto.createHmac('sha256', 'test-secret').update(rawBody).digest('hex')}`;
  const claimed = new Set();
  const replayStore = {
    claim: jest.fn(async (deliveryId) => {
      if (claimed.has(deliveryId)) return false;
      claimed.add(deliveryId);
      return true;
    }),
  };
  const verifier = new PaymentWebhookVerifier({
    secret: 'test-secret',
    replayStore,
    now: () => Date.parse('2026-09-01T01:04:00.000Z'),
  });

  await expect(verifier.verify({ rawBody, signature, deliveryId: event.id })).resolves.toEqual(event);
  await expect(verifier.verify({ rawBody, signature, deliveryId: event.id }))
    .rejects.toThrow('already been processed');
  expect(replayStore.claim).toHaveBeenCalledWith('delivery-123', '2026-09-01T01:05:00.000Z');
});

test('receiver rejects stale signed events before claiming the delivery id', async () => {
  const event = {
    id: 'delivery-old',
    type: EVENT_TYPES.PAYMENT_CONFIRMED,
    createdAt: '2026-09-01T01:00:00.000Z',
    data: {},
  };
  const rawBody = JSON.stringify(event);
  const signature = `sha256=${crypto.createHmac('sha256', 'test-secret').update(rawBody).digest('hex')}`;
  const replayStore = { claim: jest.fn() };
  const verifier = new PaymentWebhookVerifier({
    secret: 'test-secret',
    replayStore,
    now: () => Date.parse('2026-09-01T01:06:00.000Z'),
  });

  await expect(verifier.verify({ rawBody, signature, deliveryId: event.id }))
    .rejects.toThrow('timestamp window');
  expect(replayStore.claim).not.toHaveBeenCalled();
});
