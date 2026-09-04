const mockFindOneAndUpdate = jest.fn();
const mockDistinct = jest.fn();
const mockCreate = jest.fn();
const mockPresenceFindOneAndUpdate = jest.fn();
const mockPresenceDeleteOne = jest.fn();
const mockPresenceLean = jest.fn();
const mockPresenceCountDocuments = jest.fn();
const mockPresenceHealthLean = jest.fn();
const mockChatCountDocuments = jest.fn();
const mockMongoPing = jest.fn();
const mockRateLimitFindOneAndUpdate = jest.fn();
const mockPresenceFind = jest.fn(() => ({
  sort() { return this; },
  limit() { return this; },
  lean: mockPresenceLean
}));
const mockPresenceFindOne = jest.fn(() => ({
  sort() { return this; },
  select() { return this; },
  lean: mockPresenceHealthLean
}));

jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    db: { admin: () => ({ ping: mockMongoPing }) }
  }
}));

jest.mock('../models/MetaverseCharacter', () => ({
  findOneAndUpdate: mockFindOneAndUpdate,
  distinct: mockDistinct,
  create: mockCreate
}));

jest.mock('../models/MetaversePresence', () => ({
  find: mockPresenceFind,
  findOne: mockPresenceFindOne,
  findOneAndUpdate: mockPresenceFindOneAndUpdate,
  deleteOne: mockPresenceDeleteOne,
  countDocuments: mockPresenceCountDocuments
}));

jest.mock('../models/MetaverseChatMessage', () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: mockChatCountDocuments
}));

jest.mock('../models/MetaverseRateLimit', () => ({
  findOneAndUpdate: mockRateLimitFindOneAndUpdate
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const metaverseRoutes = require('./metaverse');

function testApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/metaverse', metaverseRoutes);
  return app;
}

describe('authenticated MyZubster metaverse identity', () => {
  const userId = '64f000000000000000000001';
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'metaverse-auth-test-secret';
    app = testApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDistinct.mockResolvedValue(['H4x0r']);
    mockPresenceLean.mockResolvedValue([]);
    mockPresenceFindOneAndUpdate.mockResolvedValue({});
    mockPresenceDeleteOne.mockResolvedValue({ deletedCount: 1 });
    mockMongoPing.mockResolvedValue({ ok: 1 });
    mockPresenceCountDocuments.mockResolvedValue(2);
    mockChatCountDocuments.mockResolvedValue(4);
    mockPresenceHealthLean.mockResolvedValue({ lastSeenAt: new Date(Date.now() - 5000) });
    mockRateLimitFindOneAndUpdate.mockResolvedValue({ count: 1 });
  });

  test('reports aggregate shared-world health without exposing player data', async () => {
    const response = await request(app)
      .get('/api/metaverse/health')
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-metaverse-transport']).toBe('shared-polling');
    expect(response.body).toMatchObject({
      success: true,
      status: 'healthy',
      worldId: 'neon-plaza',
      transport: 'shared-polling',
      mongodb: 'connected',
      activePlayers: 2,
      recentChatMessages: 4,
      retention: { presenceSeconds: 90, chatSeconds: 3600 }
    });
    expect(response.body.mongodbPingMs).toEqual(expect.any(Number));
    expect(response.body.latestHeartbeatAgeMs).toEqual(expect.any(Number));
    expect(response.body).not.toHaveProperty('players');
    expect(response.body).not.toHaveProperty('messages');
  });

  test('reuses the account-linked character and ignores guest identity claims', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      characterId: `account-${userId}`,
      displayName: 'H4x0r',
      characterName: 'H4x0r',
      archetype: 'guardian',
      identityStatus: 'account-linked',
      github: {
        login: 'DanielIoni-creator',
        profileUrl: 'https://github.com/DanielIoni-creator'
      }
    });

    const token = jwt.sign({ userId, username: 'daniel', role: 'user' }, process.env.JWT_SECRET);
    const response = await request(app)
      .post('/api/metaverse/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'Daniel Ioni',
        characterName: 'DANIELIONI-648',
        archetype: 'explorer',
        myzId: 'client-supplied-id'
      })
      .expect(201);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      {
        accountUserId: userId,
        worldId: 'neon-plaza',
        identityStatus: 'account-linked'
      },
      { $set: { lastSeenAt: expect.any(Date) } },
      { new: true }
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(response.body.identityMode).toBe('account-linked');
    expect(response.body.persistence).toBe('linked-existing');
    expect(response.body.player).toMatchObject({
      displayName: 'H4x0r',
      characterName: 'H4x0r',
      archetype: 'guardian',
      myzId: `account-${userId}`,
      identityStatus: 'account-linked',
      github: {
        login: 'DanielIoni-creator',
        profileUrl: 'https://github.com/DanielIoni-creator'
      }
    });

    await request(app)
      .post('/api/metaverse/leave')
      .send({ sessionId: response.body.sessionId })
      .expect(200);
  });

  test('does not silently create a guest when an authenticated account has no linked character', async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);
    const token = jwt.sign({ userId, username: 'daniel', role: 'user' }, process.env.JWT_SECRET);

    const response = await request(app)
      .post('/api/metaverse/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Daniel Ioni', characterName: 'DANIELIONI-648' })
      .expect(409);

    expect(response.body.error).toMatch(/No verified MyZubster character/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('enforces the shared join limit before identity lookup', async () => {
    mockRateLimitFindOneAndUpdate.mockResolvedValue({ count: 9 });

    const response = await request(app)
      .post('/api/metaverse/join')
      .send({ displayName: 'Flood User', characterName: 'FLOOD-01' })
      .expect(429);

    expect(response.headers['retry-after']).toMatch(/^\d+$/);
    expect(response.body.error).toBe('Join rate exceeded');
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  test('rejects an invalid token instead of downgrading it to a guest', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});

    await request(app)
      .post('/api/metaverse/join')
      .set('Authorization', 'Bearer invalid-token')
      .send({ displayName: 'Daniel Ioni', characterName: 'DANIELIONI-648' })
      .expect(401);

    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });
});
