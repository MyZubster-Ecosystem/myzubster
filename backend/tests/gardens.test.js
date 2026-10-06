const request = require('supertest');
const express = require('express');
const gardenRoutes = require('../src/routes/gardens');

describe('legacy garden API privacy gate', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/gardens', gardenRoutes);

  test('does not expose legacy precise garden records', async () => {
    const response = await request(app).get('/api/gardens');
    expect(response.status).toBe(410);
    expect(response.body.code).toBe('LEGACY_GARDEN_API_DISABLED');
  });

  test('does not accept legacy plaintext location writes', async () => {
    const response = await request(app)
      .post('/api/gardens')
      .send({ name: 'Private garden', latitude: 44.0637, longitude: 12.5678 });
    expect(response.status).toBe(410);
    expect(JSON.stringify(response.body)).not.toContain('44.0637');
  });
});
