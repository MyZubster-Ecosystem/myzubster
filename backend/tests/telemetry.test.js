const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

jest.setTimeout(60000);

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(cors());
  app.use(express.json());
  const telemetryRoutes = require('../src/routes/telemetry');
  app.use('/api/telemetry', telemetryRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

const validSample = {
  robotId: 'eva-ioni-001',
  temperature: 24.5,
  humidity: 55.0,
  battery: 87.0,
  status: 'exploring',
};

describe('Space Station telemetry API', () => {
  it('POST /api/telemetry accepts valid telemetry', async () => {
    const res = await request(app).post('/api/telemetry').send(validSample);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.robotId).toBe('eva-ioni-001');
  });

  it('POST /api/telemetry rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/telemetry').send({ robotId: 'eva-ioni-001' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/telemetry rejects out-of-range humidity', async () => {
    const res = await request(app).post('/api/telemetry').send({ ...validSample, humidity: 150 });
    expect(res.status).toBe(400);
  });

  it('POST /api/telemetry rejects non-numeric temperature', async () => {
    const res = await request(app).post('/api/telemetry').send({ ...validSample, temperature: 'hot' });
    expect(res.status).toBe(400);
  });

  it('GET /api/telemetry lists stored telemetry', async () => {
    await request(app).post('/api/telemetry').send(validSample);
    const res = await request(app).get('/api/telemetry');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
