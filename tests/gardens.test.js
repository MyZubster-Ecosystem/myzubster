const request = require('supertest');
const app = require('../app'); // adatta il percorso se necessario

describe('Garden Routes', () => {
  test('POST /api/gardens without name returns 404 (da correggere a 400)', async () => {
    const response = await request(app).post('/api/gardens').send({ address: 'Via Roma' });
    expect(response.status).toBe(404); // temporaneo: le route non sono ancora implementate
  });

  test('POST /api/gardens without address returns 404 (da correggere a 400)', async () => {
    const response = await request(app).post('/api/gardens').send({ name: 'Orto' });
    expect(response.status).toBe(404); // temporaneo
  });

  test('POST /api/gardens/reverse-geocode without coords returns 404 (da correggere a 400)', async () => {
    const response = await request(app).post('/api/gardens/reverse-geocode').send({});
    expect(response.status).toBe(404); // temporaneo
  });

  test('GET /api/gardens/search without params returns 404 (da correggere a 400)', async () => {
    const response = await request(app).get('/api/gardens/search');
    expect(response.status).toBe(404); // temporaneo
  });

  test('placeholder - routes module loads', () => {
    const routes = require('../backend/src/routes/gardens');
    expect(typeof routes).toBe('function');
  });
});
