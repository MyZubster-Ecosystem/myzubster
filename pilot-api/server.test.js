const request = require('supertest');
const app = require('./server');

describe('Synthetic Pilot API', () => {
  test('health endpoint identifies synthetic environment', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, synthetic: true });
  });

  test('operator can advance an open intervention', async () => {
    const res = await request(app).post('/interventions/INT-001/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
  });

  test('operator is blocked from closing a verification item', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ROLE_NOT_ALLOWED');
  });

  test('reviewer can close a verification item', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-reviewer', role: 'reviewer' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  test('unknown intervention returns 404', async () => {
    const res = await request(app).post('/interventions/DOES-NOT-EXIST/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('INTERVENTION_NOT_FOUND');
  });

  test('audit chain verifies', async () => {
    const res = await request(app).get('/audit/verify');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.events).toBeGreaterThan(0);
  });
});
