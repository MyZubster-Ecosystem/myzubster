/**
 * Telemetry API tests — Bounty #002 (issue #391)
 *
 * Tests cover:
 *  - POST /api/telemetry: submit valid and invalid telemetry
 *  - GET  /api/telemetry: retrieve with filters
 *
 * Uses in-memory store (NODE_ENV=test, no real MongoDB).
 */

const request = require('supertest');

// Ensure in-memory mode (no MongoDB)
process.env.NODE_ENV = 'test';

const app = require('../server');

describe('POST /api/telemetry', () => {
  it('accepts valid telemetry and returns 201', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({
        robotId: 'robot-001',
        type: 'sensor',
        payload: { speed: 1.2, heading: 90 },
        temperature: 22.5,
        battery: 87,
        status: 'ok'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.robotId).toBe('robot-001');
    expect(res.body.data.type).toBe('sensor');
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.data.receivedAt).toBeDefined();
  });

  it('accepts telemetry with position data', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({
        robotId: 'robot-002',
        type: 'position',
        payload: { zone: 'dock-A' },
        lat: -23.55,
        lng: -46.63,
        battery: 50
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects when robotId is missing', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ payload: { speed: 1 } });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/robotId/i);
  });

  it('rejects when payload is missing', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/payload/i);
  });

  it('rejects out-of-range temperature', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, temperature: 9999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/temperature/i);
  });

  it('rejects out-of-range battery', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, battery: -5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/battery/i);
  });

  it('rejects invalid lat', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, lat: 999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/lat/i);
  });

  it('rejects invalid lng', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, lng: -999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/lng/i);
  });

  it('rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, type: 'unknown' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/type/i);
  });

  it('rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-001', payload: {}, status: 'broken' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/status/i);
  });

  it('rejects empty body gracefully', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/telemetry', () => {
  it('returns list of telemetry entries', async () => {
    // Submit one entry first
    await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'get-test-robot', payload: { value: 42 } });

    const res = await request(app).get('/api/telemetry');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.returned).toBeGreaterThan(0);
  });

  it('filters by robotId', async () => {
    await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'filter-robot-XYZ', payload: { val: 1 } });

    const res = await request(app).get('/api/telemetry?robotId=filter-robot-XYZ');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(e => e.robotId === 'filter-robot-XYZ')).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters by type', async () => {
    await request(app)
      .post('/api/telemetry')
      .send({ robotId: 'robot-diag', type: 'diagnostic', payload: { check: 'memory' } });

    const res = await request(app).get('/api/telemetry?type=diagnostic');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(e => e.type === 'diagnostic')).toBe(true);
  });

  it('respects limit and skip', async () => {
    const res = await request(app).get('/api/telemetry?limit=2&skip=0');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.limit).toBe(2);
  });

  it('returns empty array when no results match filter', async () => {
    const res = await request(app).get('/api/telemetry?robotId=nonexistent-robot-99999');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});
