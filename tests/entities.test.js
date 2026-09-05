const request = require('supertest');
const app = require('../server');

describe('Canonical interactive entities', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('GET /api/entities exposes all 16 canonical entities', async () => {
    const response = await request(app).get('/api/entities');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.count).toBe(16);
    expect(response.body.entities.map(entity => entity.slug)).toEqual(expect.arrayContaining(['zorgax', 'life-pathfinder', 'circula', 'mrv-oracle', 'github-chronicler', 'selya-9', 'khar-vel', 'nythera', 'oruun']));
    expect(response.body.policy.serverMemory).toBe(false);
    expect(response.body.policy.automaticSettlement).toBe(false);
  });

  test('GET /api/entities/:slug returns the selected canonical profile', async () => {
    const response = await request(app).get('/api/entities/selya-9');
    expect(response.status).toBe(200);
    expect(response.body.entity.displayName).toBe('Selya-9');
    expect(response.body.entity.capabilities).toContain('provenance');
  });

  test('GET /api/entities/bounties exposes two evidence-first tracks for every entity', async () => {
    const response = await request(app).get('/api/entities/bounties');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.summary.entityCount).toBe(16);
    expect(response.body.summary.bountyCount).toBe(32);
    expect(response.body.summary.proposedMYZ).toBe(6400);
    expect(new Set(response.body.bounties.map(bounty => bounty.id)).size).toBe(32);
    expect(new Set(response.body.bounties.map(bounty => bounty.track))).toEqual(new Set(['entity-completion', 'visual-identity']));
    expect(response.body.policy.rewardKind).toBe('internal_accounting');
    expect(response.body.policy.automaticSettlement).toBe(false);
    expect(response.body.policy.externalPaymentPromise).toBe(false);
  });

  test('GET /api/entities/bounties filters the visual identity track', async () => {
    const response = await request(app).get('/api/entities/bounties?track=visual-identity');
    expect(response.status).toBe(200);
    expect(response.body.summary.bountyCount).toBe(16);
    expect(response.body.summary.totalBountyCount).toBe(32);
    expect(response.body.summary.proposedMYZ).toBe(2400);
    expect(response.body.bounties.every(bounty => bounty.track === 'visual-identity')).toBe(true);
  });

  test('GET /api/entities/:slug/bounties returns completion, visual requirements and proposal links', async () => {
    const response = await request(app).get('/api/entities/oruun/bounties');
    expect(response.status).toBe(200);
    expect(response.body.entity.id).toBe('ORUUN-001');
    expect(response.body.completion.percent).toBe(42);
    expect(response.body.completion.complete).toBe(2);
    expect(response.body.completion.inReview).toBe(1);
    expect(response.body.summary).toEqual({ bountyCount: 2, proposedMYZ: 400 });
    expect(response.body.bounties[1].deliverables).toEqual(expect.arrayContaining([expect.stringMatching(/Avatar quadrato/), expect.stringMatching(/Hero 16:9/), expect.stringMatching(/SVG/)]));
    expect(response.body.bounties[0].proposalUrl).toMatch(/^https:\/\/github\.com\/MyZubster-Ecosystem\/MyZubster-Oruun\/issues\/new\?/);
  });

  test('POST /api/entities/:slug/chat validates the message', async () => {
    const response = await request(app).post('/api/entities/circula/chat').send({ message: '   ' });
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('POST /api/entities/:slug/chat uses the selected persona with Ollama', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: { content: 'Provenienza verificata.' } }) });
    const response = await request(app).post('/api/entities/nythera/chat').send({ message: 'Organizza queste fonti.' });
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('generative');
    expect(response.body.entity.slug).toBe('nythera');
    expect(response.body.response).toBe('Provenienza verificata.');
    expect(response.body.memoryStored).toBe(false);
    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.messages[0].content).toContain('Nythera');
    expect(payload.messages[0].content).toMatch(/evidence-first/i);
    expect(payload.messages[1]).toEqual({ role: 'user', content: 'Organizza queste fonti.' });
  });

  test('POST /api/entities/:slug/chat remains interactive when Ollama is offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const response = await request(app).post('/api/entities/khar-vel/chat').send({ message: 'Analizza i failure mode.' });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.mode).toBe('guided-fallback');
    expect(response.body.provider).toBe('registry');
    expect(response.body.response).toContain('Khar-Vel');
  });

  test('unknown entities return 404', async () => {
    const response = await request(app).get('/api/entities/not-canonical');
    expect(response.status).toBe(404);
  });

  test('unknown entity bounties return 404', async () => {
    const response = await request(app).get('/api/entities/not-canonical/bounties');
    expect(response.status).toBe(404);
  });
});
