process.env.JWT_SECRET = 'bot-passport-test-secret';

jest.mock('../src/models/botPassportModel', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const BotPassport = require('../src/models/botPassportModel');
const routes = require('../src/routes/botPassportRoutes');

const HASH = 'b'.repeat(64);

function appForTest() {
  const app = express();
  app.use(express.json());
  app.use('/api/bot-passports', routes);
  return app;
}

function token() {
  return jwt.sign(
    { userId: 'owner-1', role: 'user', username: 'owner' },
    process.env.JWT_SECRET
  );
}

describe('bot passport routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('requires authentication to create a bot passport', async () => {
    const response = await request(appForTest())
      .post('/api/bot-passports')
      .send({});

    expect(response.status).toBe(401);
    expect(BotPassport.create).not.toHaveBeenCalled();
  });

  test('rejects secret fields before persistence', async () => {
    const response = await request(appForTest())
      .post('/api/bot-passports')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        name: 'Evidence bot',
        softwareVersion: '1.0.0',
        releaseHash: HASH,
        apiKey: 'never-store-this'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/forbidden field/i);
    expect(BotPassport.create).not.toHaveBeenCalled();
  });

  test('returns only the public allowlist after creation', async () => {
    BotPassport.create.mockResolvedValue({
      botId: 'bot-1',
      ownerId: 'owner-1',
      name: 'Evidence bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      capabilities: ['evidence_import'],
      status: 'ACTIVE',
      token: 'hidden'
    });

    const response = await request(appForTest())
      .post('/api/bot-passports')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        name: 'Evidence bot',
        softwareVersion: '1.0.0',
        releaseHash: HASH,
        capabilities: ['evidence_import']
      });

    expect(response.status).toBe(201);
    expect(response.body.passport.ownerId).toBeUndefined();
    expect(response.body.passport.token).toBeUndefined();
    expect(response.body.passport.botId).toBe('bot-1');
    expect(BotPassport.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner-1' })
    );
  });

  test('does not let a different contributor revoke a bot passport', async () => {
    BotPassport.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(appForTest())
      .post('/api/bot-passports/bot-1/revoke')
      .set('Authorization', `Bearer ${token()}`)
      .send({ reason: 'not mine' });

    expect(response.status).toBe(404);
    expect(BotPassport.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner-1' }),
      expect.any(Object),
      { new: true }
    );
  });

  test('public lookup removes owner and internal fields', async () => {
    BotPassport.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        botId: 'bot-1',
        ownerId: 'private-owner',
        name: 'Evidence bot',
        softwareVersion: '1.0.0',
        releaseHash: HASH,
        capabilities: ['evidence_import'],
        status: 'REVOKED',
        revokedAt: new Date('2026-10-11T00:00:00.000Z'),
        revocationReason: 'private operational note',
        token: 'hidden'
      })
    });

    const response = await request(appForTest())
      .get('/api/bot-passports/bot-1');

    expect(response.status).toBe(200);
    expect(response.body.passport.ownerId).toBeUndefined();
    expect(response.body.passport.token).toBeUndefined();
    expect(response.body.passport.revocationReason).toBeUndefined();
    expect(response.body.passport.status).toBe('REVOKED');
  });
});
