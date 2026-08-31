const mockFindOneAndUpdate = jest.fn();
const mockDistinct = jest.fn();
const mockCreate = jest.fn();

jest.mock('mongoose', () => ({
  connection: { readyState: 1 }
}));

jest.mock('../models/MetaverseCharacter', () => ({
  findOneAndUpdate: mockFindOneAndUpdate,
  distinct: mockDistinct,
  create: mockCreate
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

