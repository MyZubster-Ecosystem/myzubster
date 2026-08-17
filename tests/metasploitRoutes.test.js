process.env.NODE_ENV = 'test';
process.env.METASPLOIT_INTEGRATION_ENABLED = 'false';

const request = require('supertest');
const app = require('../server');

describe('Metasploit integration', () => {
  test('reports disabled by default', async () => {
    const response = await request(app).get('/api/security/metasploit/status');

    expect(response.statusCode).toBe(200);
    expect(response.body.provider).toBe('metasploit-framework');
    expect(response.body.enabled).toBe(false);
    expect(response.body.execution_enabled).toBe(false);
  });

  test('rejects imports while disabled', async () => {
    const response = await request(app)
      .post('/api/security/metasploit/import')
      .send({ findings: [] });

    expect(response.statusCode).toBe(503);
  });
});
