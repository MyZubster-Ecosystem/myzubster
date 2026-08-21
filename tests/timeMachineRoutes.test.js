const request = require('supertest');
const app = require('../server');

describe('MyZubster Time Machine', () => {
  test('GET /api/time-machine exposes read-only module metadata', async () => {
    const response = await request(app).get('/api/time-machine');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('MyZubster Time Machine');
    expect(response.body.readOnly).toBe(true);
    expect(response.body.supportedDomains).toEqual(['plants', 'sensors', 'maps', 'robots']);
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

  test('domain endpoint rejects unsupported domains', async () => {
    const response = await request(app).get('/api/time-machine/domains/unknown/at?timestamp=2026-08-21T00:00:00.000Z');
    expect(response.status).toBe(400);
    expect(response.body.supportedDomains).toEqual(['plants', 'sensors', 'maps', 'robots']);
  });

  test('compare endpoint validates timestamps', async () => {
    const response = await request(app).get('/api/time-machine/compare?from=bad&to=also-bad&domain=plants');
    expect(response.status).toBe(400);
  });

  test('visual Time Machine page is served', async () => {
    const response = await request(app).get('/time-machine');
    expect(response.status).toBe(200);
    expect(response.text).toContain('MyZubster Time Machine');
    expect(response.text).toContain('Historical geographic view');
  });

  test('unknown snapshot returns 404', async () => {
    const response = await request(app).get('/api/time-machine/snapshots/does-not-exist');
    expect(response.status).toBe(404);
  });
});
