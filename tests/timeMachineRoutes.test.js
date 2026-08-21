const request = require('supertest');
const app = require('../server');

describe('MyZubster Time Machine', () => {
  test('GET /api/time-machine exposes read-only module metadata', async () => {
    const response = await request(app).get('/api/time-machine');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('MyZubster Time Machine');
    expect(response.body.readOnly).toBe(true);
    expect(response.body).toHaveProperty('snapshotCount');
  });

  test('GET /api/time-machine/snapshots returns an array', async () => {
    const response = await request(app).get('/api/time-machine/snapshots');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.snapshots)).toBe(true);
  });

  test('GET /api/time-machine/at requires a valid timestamp', async () => {
    const response = await request(app).get('/api/time-machine/at?timestamp=not-a-date');
    expect(response.status).toBe(400);
  });

  test('unknown snapshot returns 404', async () => {
    const response = await request(app).get('/api/time-machine/snapshots/does-not-exist');
    expect(response.status).toBe(404);
  });
});
