process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');

describe('AHP traceability API', () => {
  test('reports privacy and anchor configuration truthfully', async () => {
    const response = await request(app).get('/api/ahp-trace/health');
    expect(response.status).toBe(200);
    expect(response.body.personalOrHealthDataOnChain).toBe(false);
    expect(response.body.realAnchorConfigured).toBe(false);
  });

  test('returns a complete synthetic proof without claiming a transaction', async () => {
    const response = await request(app).get('/api/ahp-trace/demo');
    expect(response.status).toBe(200);
    expect(response.body.synthetic).toBe(true);
    expect(response.body.persisted).toBe(false);
    expect(response.body.blockchainTransaction).toBe(false);
    expect(response.body.manifest.eventCount).toBe(7);
    expect(response.body.finalEventProofValid).toBe(true);
    expect(response.body.anchor.simulated).toBe(true);
  });

  test('protects ingestion and anchoring', async () => {
    expect((await request(app).post('/api/ahp-trace/events').send({})).status).toBe(401);
    expect((await request(app).post('/api/ahp-trace/anchors').send({})).status).toBe(401);
  });
});
