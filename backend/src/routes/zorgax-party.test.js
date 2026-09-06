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
        identityStatus: 'guest-unverified',
        userId: null,
        roles: []
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
      session: null,
      restrictions: {
        concealedLocations: false,
        covertLogistics: false,
        financialActions: false,
        physicalSystemCommands: false,
        autonomousHighImpactModeration: false
      }
    });

    expect(response.body.context.capabilities).toEqual(expect.arrayContaining([
      'party.read_context',
      'party.read_community',
      'party.read_room'
    ]));
    expect(new Date(response.body.context.generatedAt).toString()).not.toBe('Invalid Date');
    expect(new Date(response.body.context.expiresAt).toString()).not.toBe('Invalid Date');
  });

  test('does not trust a caller-supplied session id as proof of a live session without storage', async () => {
    const response = await request(app)
      .get('/api/zorgax/party-context?sessionId=client-claimed-session')
      .expect(200);

    expect(response.body.context.session).toMatchObject({
      id: 'client-claimed-session',
      state: 'unknown',
      live: false,
      participantCount: null,
      source: 'unavailable'
    });
    expect(response.body.context.capabilities).not.toContain('party.read_live_status');
  });

  test('validator rejects forbidden private/sensitive fields', async () => {
    const context = await buildPartyContext();
    context.secretLocation = 'hidden coordinates';

    const result = validatePartyContext(context);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('forbidden field: secretlocation');
  });
});
