const request = require('supertest');
const app = require('./server');

describe('Synthetic Pilot API', () => {
  test('health endpoint identifies synthetic environment', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, synthetic: true });
  });

  test('operator can advance an intervention', async () => {
    const res = await request(app).post('/interventions/INT-001/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
  });

  test('operator cannot close an intervention', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
    const second = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(second.status).toBe(200);
    const third = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(third.status).toBe(200);
    const fourth = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(fourth.status).toBe(403);
  });

  test('reviewer can close a verification item', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-reviewer', role: 'reviewer' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  test('audit chain verifies', async () => {
    const res = await request(app).get('/audit/verify');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.events).toBeGreaterThan(0);
  });
});
