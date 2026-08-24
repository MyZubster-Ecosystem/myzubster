const request = require('supertest');
const app = require('../server');

describe('Canonical interactive entities', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('GET /api/entities exposes all 12 canonical entities', async () => {
    const response = await request(app).get('/api/entities');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.count).toBe(12);
    expect(response.body.entities.map(entity => entity.slug)).toEqual(expect.arrayContaining(['zorgax', 'life-pathfinder', 'circula', 'mrv-oracle', 'github-chronicler']));
    expect(response.body.policy.serverMemory).toBe(false);
    expect(response.body.policy.automaticSettlement).toBe(false);
  });

  test('GET /api/entities/:slug returns the selected canonical profile', async () => {
    const response = await request(app).get('/api/entities/mrv-oracle');
    expect(response.status).toBe(200);
    expect(response.body.entity.displayName).toBe('MRV Oracle');
    expect(response.body.entity.workflow).toContain('VALIDA');
  });

  test('POST /api/entities/:slug/chat validates the message', async () => {
    const response = await request(app).post('/api/entities/circula/chat').send({ message: '   ' });
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('POST /api/entities/:slug/chat uses the selected persona with Ollama', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: { content: 'Baseline verificata.' } }) });
    const response = await request(app).post('/api/entities/mrv-oracle/chat').send({ message: 'Controlla il KPI acqua.' });
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('generative');
    expect(response.body.entity.slug).toBe('mrv-oracle');
    expect(response.body.response).toBe('Baseline verificata.');
    expect(response.body.memoryStored).toBe(false);

    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.messages[0].content).toContain('MRV Oracle');
    expect(payload.messages[0].content).toMatch(/evidence-first/i);
    expect(payload.messages[1]).toEqual({ role: 'user', content: 'Controlla il KPI acqua.' });
  });

  test('POST /api/entities/:slug/chat remains interactive when Ollama is offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const response = await request(app).post('/api/entities/gaia-mapper/chat').send({ message: 'Come proteggo le coordinate?' });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.mode).toBe('guided-fallback');
    expect(response.body.provider).toBe('registry');
    expect(response.body.response).toContain('Gaia Mapper');
    expect(response.body.response).toMatch(/coordinate|luoghi sensibili/i);
  });

  test('unknown entities return 404', async () => {
    const response = await request(app).get('/api/entities/not-canonical');
    expect(response.status).toBe(404);
  });
});
