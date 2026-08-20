const request = require('supertest');

const app = require('../server');

describe('ZORGAX-001', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('GET /api/zorgax/profile exposes the canonical virtual identity', async () => {
    const response = await request(app).get('/api/zorgax/profile');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.entity.id).toBe('ZORGAX-001');
    expect(response.body.entity.fictional_identity).toBe(true);
    expect(response.body.disclosure).toMatch(/virtual\/fictional/i);
  });

  test('GET /zorgax serves the dedicated chat UI with opt-in memory', async () => {
    const response = await request(app).get('/zorgax');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('ZORGAX-001');
    expect(response.text).toMatch(/virtual/i);
    expect(response.text).toMatch(/Ricorda questo messaggio/i);
    expect(response.text).toMatch(/Cancella memoria/i);
  });

  test('POST /api/zorgax/chat rejects an empty message', async () => {
    const response = await request(app)
      .post('/api/zorgax/chat')
      .send({ message: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('GET /api/zorgax/status reports Ollama offline cleanly', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    const response = await request(app).get('/api/zorgax/status');

    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(false);
    expect(response.body.entity).toBe('ZORGAX-001');
    expect(response.body.virtual_identity).toBe(true);
    expect(response.body.persistent_memory).toBe(true);
    expect(response.body.memory_opt_in).toBe(true);
  });

  test('POST /api/zorgax/memory rejects missing pseudonymous memory key', async () => {
    const response = await request(app)
      .post('/api/zorgax/memory')
      .send({ content: 'Ricorda questa preferenza.' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toMatch(/chiave memoria/i);
  });

  test('POST /api/zorgax/memory refuses obvious secrets before persistence', async () => {
    const response = await request(app)
      .post('/api/zorgax/memory')
      .set('x-zorgax-memory-key', '12345678-1234-1234-1234-123456789012')
      .send({ content: 'password: super-secret-value' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toMatch(/segreti|credenziali/i);
  });

  test('POST /api/zorgax/chat uses the Zorgax system persona without requiring memory', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: 'Signal received.' } })
    });

    const response = await request(app)
      .post('/api/zorgax/chat')
      .send({ message: 'Chi sei?' });

    expect(response.status).toBe(200);
    expect(response.body.entity).toBe('ZORGAX-001');
    expect(response.body.response).toBe('Signal received.');
    expect(response.body.memory_used).toBe(0);

    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.messages[0].role).toBe('system');
    expect(payload.messages[0].content).toContain('ZORGAX-001');
    expect(payload.messages[0].content).toMatch(/virtual\/fictional/i);
    expect(payload.messages[1]).toEqual({ role: 'user', content: 'Chi sei?' });
  });
});
