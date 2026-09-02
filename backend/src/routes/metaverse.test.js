const request = require('supertest');
const app = require('../index');

describe('MyZubster metaverse API', () => {
  let sessionId;

  test('reports an explicit degraded health status without MongoDB', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await request(app)
      .get('/api/metaverse/health')
      .expect(503);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: false,
      status: 'degraded',
      worldId: 'neon-plaza',
      transport: 'unavailable',
      mongodb: 'disconnected'
    });
    warning.mockRestore();
  });

  test('joins Neon Plaza as a guest identity', async () => {
    const response = await request(app)
      .post('/api/metaverse/join')
      .send({
        displayName: 'Demo User',
        characterName: 'AERON-17',
        archetype: 'explorer',
        myzId: 'MYZ-DEMO-000001'
      })
      .expect(201);

    sessionId = response.body.sessionId;
    expect(response.body.success).toBe(true);
    expect(response.body.player.characterName).toBe('AERON-17');
    expect(response.body.player.identityStatus).toBe('guest');
    expect(response.body.identityMode).toBe('guest-unverified');
    expect(response.body.totalCharacters).toBeGreaterThanOrEqual(1);
    // The isolated API test intentionally has no Mongo connection. Production
    // server.js gates /join on Mongo and therefore returns "durable" there.
    expect(response.body.persistence).toBe('ephemeral');
  });

  test('moves a joined player inside world bounds', async () => {
    const response = await request(app)
      .post('/api/metaverse/move')
      .send({ sessionId, x: 500, y: -50 })
      .expect(200);

    expect(response.body.player.x).toBe(96);
    expect(response.body.player.y).toBe(8);
  });

  test('lists the active player and public character total in the world snapshot', async () => {
    const response = await request(app)
      .get('/api/metaverse/world')
      .expect(200);

    expect(response.body.players.some((player) => player.id === sessionId)).toBe(true);
    expect(response.body.totalCharacters).toBeGreaterThanOrEqual(1);
    expect(response.body.featuredCharacters).toEqual([]);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-metaverse-transport']).toBe('unavailable');
  });

  test('shares presence and recent chat through the sync endpoint', async () => {
    const chatResponse = await request(app)
      .post('/api/metaverse/chat')
      .send({ sessionId, text: 'Ciao Neon Plaza' })
      .expect(201);

    const syncResponse = await request(app)
      .post('/api/metaverse/sync')
      .send({ sessionId })
      .expect(200);

    expect(syncResponse.body.transport).toBe('ephemeral');
    expect(syncResponse.body.players.some((player) => player.id === sessionId)).toBe(true);
    expect(syncResponse.body.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: chatResponse.body.message.id,
        characterName: 'AERON-17',
        text: 'Ciao Neon Plaza'
      })
    ]));
    expect(new Date(syncResponse.body.cursor).toString()).not.toBe('Invalid Date');
  });

  test('keeps an emote visible across a browser synchronization interval', async () => {
    await request(app)
      .post('/api/metaverse/emote')
      .send({ sessionId, emote: 'wave' })
      .expect(200);

    await new Promise((resolve) => setTimeout(resolve, 2100));

    const syncResponse = await request(app)
      .post('/api/metaverse/sync')
      .send({ sessionId })
      .expect(200);

    expect(syncResponse.body.players.find((player) => player.id === sessionId)?.emote).toBe('wave');
  });

  afterAll(async () => {
    if (sessionId) {
      await request(app).post('/api/metaverse/leave').send({ sessionId });
    }
  });
});
