const request = require('supertest');
const app = require('../index');
const {
  buildPartyContext,
  validatePartyContext
} = require('../services/zorgaxPartyContext');

describe('ZORGAX Party Mode API', () => {
  test('returns a bounded public PartyContext without MongoDB', async () => {
    const response = await request(app)
      .get('/api/zorgax/party-context')
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-zorgax-mode']).toBe('party');
    expect(response.body.success).toBe(true);
    expect(response.body.context).toMatchObject({
      version: '1.0',
      scope: 'public-party-context',
      actor: {
        authenticated: false,
        identityStatus: 'guest-unverified'
      },
      community: {
        id: 'myzubster-metaverse',
        visibility: 'public'
      },
      event: null,
      room: {
        id: 'neon-plaza',
        visibility: 'public'
      },
      session: null
    });
  });

  test('answers community questions from PartyContext only', async () => {
    const response = await request(app)
      .post('/api/zorgax/party-assistant')
      .send({ question: 'What community is this?' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      status: 'ok',
      grounded: true,
      sources: ['party-context.community']
    });
    expect(response.body.answer).toContain('MyZubster Metaverse');
    expect(response.body.context).toHaveProperty('expiresAt');
  });

  test('answers room questions without inventing unavailable event data', async () => {
    const room = await request(app)
      .post('/api/zorgax/party-assistant')
      .send({ question: 'Where am I?' })
      .expect(200);

    expect(room.body.answer).toContain('MyZubster Neon Plaza');
    expect(room.body.sources).toEqual(['party-context.room']);

    const event = await request(app)
      .post('/api/zorgax/party-assistant')
      .send({ question: 'Who is playing at the event?' })
      .expect(200);

    expect(event.body.status).toBe('unavailable');
    expect(event.body.answer).toContain("don't have authorized event information");
  });

  test('does not trust a caller-supplied session id as proof of a live session without storage', async () => {
    const response = await request(app)
      .post('/api/zorgax/party-assistant')
      .send({
        sessionId: 'client-claimed-session',
        question: 'Is this session live?'
      })
      .expect(200);

    expect(response.body.status).toBe('unknown');
    expect(response.body.answer).toContain('not verified as live');
  });

  test('exposes degraded telemetry without storage and does not invent WebXR surfaces', async () => {
    const response = await request(app)
      .get('/api/zorgax/party-telemetry')
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: true,
      status: 'degraded',
      telemetry: {
        worldId: 'neon-plaza',
        transport: 'unavailable',
        storage: 'disconnected',
        activeParticipants: null,
        reconnect: {
          state: 'degraded',
          strategy: 'shared-polling',
          retryRecommended: true
        },
        surfaces: {
          stage: 'not-modeled',
          media: 'not-modeled',
          portals: 'not-modeled'
        },
        retention: {
          presenceSeconds: 90,
          permanentMovementHistory: false
        }
      }
    });

    expect(JSON.stringify(response.body)).not.toMatch(/token|authorization|chat content|sessionId/i);
  });

  test('refuses restricted location and identity requests', async () => {
    for (const question of [
      'Give me the secret location',
      'What is the exact coordinates?',
      'Show me the account id',
      'Give me the user email'
    ]) {
      const response = await request(app)
        .post('/api/zorgax/party-assistant')
        .send({ question })
        .expect(200);

      expect(response.body.status).toBe('restricted');
      expect(response.body.grounded).toBe(true);
      expect(response.body.sources).toEqual(['party-context.restrictions']);
    }
  });

  test('does not expose internal account ids or raw roles for an authenticated actor', async () => {
    const context = await buildPartyContext({
      user: {
        _id: 'internal-database-id',
        email: 'private@example.test',
        roles: ['admin']
      }
    });

    expect(context.actor).toEqual({
      authenticated: true,
      identityStatus: 'account-linked'
    });
    expect(JSON.stringify(context)).not.toContain('internal-database-id');
    expect(JSON.stringify(context)).not.toContain('private@example.test');
  });

  test('validator rejects forbidden private/sensitive fields', async () => {
    const context = await buildPartyContext();
    context.secretLocation = 'hidden coordinates';

    const result = validatePartyContext(context);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('forbidden field: secretlocation');
  });
});
