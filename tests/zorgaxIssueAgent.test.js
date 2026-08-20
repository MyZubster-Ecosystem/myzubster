const request = require('supertest');
const app = require('../server');

describe('Zorgax GitHub Issue Agent', () => {
  const originalWrite = process.env.ZORGAX_GITHUB_WRITE_ENABLED;
  const originalAdmin = process.env.ZORGAX_ADMIN_KEY;

  afterEach(() => {
    if (originalWrite === undefined) delete process.env.ZORGAX_GITHUB_WRITE_ENABLED;
    else process.env.ZORGAX_GITHUB_WRITE_ENABLED = originalWrite;

    if (originalAdmin === undefined) delete process.env.ZORGAX_ADMIN_KEY;
    else process.env.ZORGAX_ADMIN_KEY = originalAdmin;
  });

  it('reports that human review is required', async () => {
    const response = await request(app).get('/api/zorgax/issues/status');
    expect(response.statusCode).toBe(200);
    expect(response.body.entity).toBe('ZORGAX-001');
    expect(response.body.human_review_required).toBe(true);
  });

  it('creates a structured issue draft without publishing', async () => {
    const response = await request(app)
      .post('/api/zorgax/issues/propose')
      .send({
        title: 'Possible anomaly in circular-water dataset',
        summary: 'A sensor value differs significantly from the preceding samples and should be checked.',
        category: 'data-anomaly',
        severity: 'medium',
        evidence: [{
          source: 'sensor-feed',
          reference: 'observation-123',
          claim_class: 'uncertain',
          note: 'Automated observation; requires operator verification.'
        }]
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.published).toBe(false);
    expect(response.body.draft.title).toMatch(/^\[ZORGAX\]/);
    expect(response.body.draft.body).toContain('requires human review');
    expect(response.body.draft.metadata.requires_human_review).toBe(true);
  });

  it('refuses to publish while GitHub writes are disabled', async () => {
    process.env.ZORGAX_GITHUB_WRITE_ENABLED = 'false';
    const response = await request(app)
      .post('/api/zorgax/issues/publish')
      .send({ title: 'Test proposal', summary: 'This should not be published.' });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toMatch(/disabled/i);
  });

  it('rejects probable secrets from issue drafts', async () => {
    const response = await request(app)
      .post('/api/zorgax/issues/propose')
      .send({
        title: 'Credential found',
        summary: 'api_key=sk_example_example_example_example'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toMatch(/credential|secret/i);
  });
});
