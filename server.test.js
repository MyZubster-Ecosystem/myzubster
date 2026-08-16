const request = require('supertest');
const app = require('./backend/src/index');

describe('Synthetic Pilot API', () => {
  test('health endpoint identifies synthetic environment', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('operator can advance an intervention', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
  });

  test('operator cannot close an intervention', async () => {
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
    const second = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(second.status).toBe(200);
    const third = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(third.status).toBe(403);
  });

  test('reviewer can close a verification item', async () => {
    const res = await request(app).post('/interventions/INT-003/verify').send({ actor: 'test-reviewer', role: 'reviewer' });
    expect(res.status).toBe(200);
  });

  test('audit chain verifies', async () => {
    const res = await request(app).get('/audit/INT-003');
    expect(res.status).toBe(200);
  });
});
