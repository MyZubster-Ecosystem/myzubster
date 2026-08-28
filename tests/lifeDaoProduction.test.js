const request = require('supertest');
const app = require('../server');

describe('LIFE DAO lane on production server', () => {
  test('GET /api/dao/life/status is available from the Vercel entrypoint', async () => {
    const response = await request(app).get('/api/dao/life/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.governanceMode).toBe('advisory_non_binding');
    expect(response.body.data.bindingVotingPower).toBe(0);
    expect(response.body.data.enrollment).toBe('explicit-consent-only');
  });

  test('gateway discovery advertises the LIFE DAO advisory endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.life.dao_advisory).toBe('/api/dao/life/status');
  });
});
