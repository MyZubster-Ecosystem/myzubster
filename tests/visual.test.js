const request = require('supertest');
const app = require('../server');

describe('MyZubster Visual MVP', () => {
  it('serves the character, comic and AI workflow at /visual', async () => {
    const response = await request(app).get('/visual');

    expect(response.statusCode).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('MyZubster Visual');
    expect(response.text).toContain('Generate comic');
    expect(response.text).toContain('Download comic SVG');
    expect(response.text).toContain('/visual-ai.js');
    expect(response.text).toContain('Open GitHub collaboration issue');
  });

  it('serves the approved Visual gallery page', async () => {
    const response = await request(app).get('/visual/gallery');
    expect(response.statusCode).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('Visual gallery');
  });

  it('fails transparently when AI provider credentials are not configured', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const response = await request(app)
      .post('/api/visual/generate-image')
      .send({
        character: {
          display_name: 'Nova Merchant',
          role: 'Shop owner',
          visual: { style: 'Cyberpunk comic', traits: 'silver jacket' },
          collaboration: { intent: 'Explore a future collaboration' },
          consent: { authorized_likeness: true }
        },
        story: {
          title: 'Proposal scene',
          panels: [{ speaker: 'Nova Merchant', dialogue: 'Hello MyZubster.' }]
        }
      });

    if (originalKey) process.env.OPENAI_API_KEY = originalKey;

    expect(response.statusCode).toBe(503);
    expect(response.body.ok).toBe(false);
    expect(response.body.code).toBe('provider_unconfigured');
  });
});
