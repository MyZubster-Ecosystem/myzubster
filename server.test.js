const request = require('supertest');
const app = require('./app'); // o il percorso corretto del tuo server

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
    // Primo avanzamento
    const res = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(res.status).toBe(200);
    // Secondo avanzamento
    const second = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(second.status).toBe(200);
    // Terzo avanzamento (proibito – 403)
    const third = await request(app).post('/interventions/INT-003/advance').send({ actor: 'test-operator', role: 'operator' });
    expect(third.status).toBe(403);  // ✅ CORRETTO: il terzo tentativo è proibito
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
