const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

const TEST_ADMIN_KEY = 'test-admin-key';
process.env.ADMIN_API_KEY = TEST_ADMIN_KEY;

jest.mock('../src/services/xmrVerifier', () => ({
  verifyXmrPayment: jest.fn().mockResolvedValue({
    verified: true,
    confirmations: 20,
  }),
}));

jest.setTimeout(60000);

let app;
let mongoServer;

function admin(req) {
  return req.set('x-admin-api-key', TEST_ADMIN_KEY);
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(cors());
  app.use(express.json());
  const paymentRoutes = require('../src/routes/bounty-payments');
  app.use('/api/bounty-payments', paymentRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  delete process.env.ADMIN_API_KEY;
});

describe('Bounty payment integration', () => {
  it('fails closed when the admin key is not configured', async () => {
    const previous = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;
    const res = await request(app).get('/api/bounty-payments');
    process.env.ADMIN_API_KEY = previous;
    expect(res.status).toBe(503);
  });

  it('rejects requests without the admin key', async () => {
    const res = await request(app).get('/api/bounty-payments');
    expect(res.status).toBe(401);
  });

  it('rejects incorrect admin credentials', async () => {
    const res = await request(app).get('/api/bounty-payments').set('x-admin-api-key', 'wrong-key-123');
    expect(res.status).toBe(401);
  });

  it('accepts correct configured credentials', async () => {
    const res = await admin(request(app).get('/api/bounty-payments'));
    expect(res.status).toBe(200);
  });

  it('creates a simulated payment in PENDING state', async () => {
    const res = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'laurentketterle-hub', amount: 250, currency: 'MYZ', kind: 'simulated',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.state).toBe('PENDING');
    expect(res.body.data.kind).toBe('simulated');
  });

  it('refuses to confirm a simulated payment', async () => {
    const created = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'laurentketterle-hub', amount: 250, currency: 'MYZ', kind: 'simulated',
    });
    const res = await admin(request(app).post('/api/bounty-payments/' + created.body.data._id + '/confirm')).send({ txid: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an unsupported currency', async () => {
    const res = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'x', amount: 1, currency: 'USD',
    });
    expect(res.status).toBe(400);
  });

  it('requires a txid to confirm a real payment', async () => {
    const created = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'laurentketterle-hub', amount: 0.05, currency: 'XMR', kind: 'real',
      address: '48xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    const id = created.body.data._id;
    const res = await admin(request(app).post('/api/bounty-payments/' + id + '/confirm')).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('moves a real payment PENDING -> SUBMITTED -> CONFIRMED only after verification', async () => {
    const created = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'laurentketterle-hub', amount: 0.05, currency: 'XMR', kind: 'real',
      address: '48xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    expect(created.status).toBe(201);
    const id = created.body.data._id;

    const submitted = await admin(request(app).post('/api/bounty-payments/' + id + '/submit')).send({ txid: 'pending-tx' });
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.state).toBe('SUBMITTED');

    const confirmed = await admin(request(app).post('/api/bounty-payments/' + id + '/confirm')).send({ txid: 'a'.repeat(64) });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.state).toBe('CONFIRMED');
    expect(confirmed.body.data.txid).toBe('a'.repeat(64));
    expect(confirmed.body.data.metadata.verification.verified).toBe(true);
  });

  it('keeps a failed independent verification from reaching CONFIRMED', async () => {
    const verifier = require('../src/services/xmrVerifier');
    verifier.verifyXmrPayment.mockResolvedValueOnce({ verified: false, reason: 'recipient mismatch' });

    const created = await admin(request(app).post('/api/bounty-payments')).send({
      issueId: '394', contributor: 'laurentketterle-hub', amount: 0.05, currency: 'XMR', kind: 'real',
      address: '48xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    const id = created.body.data._id;
    await admin(request(app).post('/api/bounty-payments/' + id + '/submit')).send({ txid: 'pending-tx' });
    const res = await admin(request(app).post('/api/bounty-payments/' + id + '/confirm')).send({ txid: 'b'.repeat(64) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const payment = await admin(request(app).get('/api/bounty-payments/' + id));
    expect(payment.body.data.state).toBe('SUBMITTED');
  });

  it('documents MYZ payment rails for authenticated administrators', async () => {
    const res = await admin(request(app).get('/api/bounty-payments/myz/metadata'));
    expect(res.status).toBe(200);
    expect(res.body.data.network).toContain('Tari');
  });
});
