const request = require('supertest');
const express = require('express');

jest.mock('../src/services/gateway', () => ({
  config: { baseUrl: 'http://mock-gateway:4000' },
  health: jest.fn(async () => ({ reachable: true, status: 200, data: { ok: true } })),
  relay: jest.fn(async () => ({ ok: true, status: 200, data: { received: true } })),
}));

const gateway = require('../src/services/gateway');
const gatewayRoutes = require('../src/routes/gateway');

describe('Gateway API integration', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/gateway', gatewayRoutes);
  });

  it('GET /api/gateway/status reports gateway reachability', async () => {
    const res = await request(app).get('/api/gateway/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reachable).toBe(true);
  });

  it('POST /api/gateway/relay forwards payload successfully', async () => {
    const res = await request(app).post('/api/gateway/relay').send({ hello: 'space-station' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 502 when gateway is unreachable', async () => {
    gateway.relay.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).post('/api/gateway/relay').send({});
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });
});
