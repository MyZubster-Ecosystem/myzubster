const jwt = require('jsonwebtoken');
const VirtualSession = require('../models/VirtualSession');
const {
  mintSocketToken,
  verifySocketToken,
  normalizeChannel,
  authorizeChannel
} = require('./realtimeGateway');

jest.mock('../models/VirtualSession', () => ({
  findOne: jest.fn()
}));

describe('realtimeGateway', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.REALTIME_TOKEN_SECRET;
    jest.clearAllMocks();
  });

  test('mints and verifies a bounded realtime token', () => {
    const token = mintSocketToken({ userId: 'u1', role: 'user', correlationId: 'req-1' });
    const decoded = verifySocketToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.role).toBe('user');
    expect(decoded.correlationId).toBe('req-1');
    expect(decoded.expiresAt).toBeTruthy();
  });

  test('rejects tokens with the wrong purpose', () => {
    const token = jwt.sign({ sub: 'u1', purpose: 'other' }, 'test-secret', {
      issuer: 'myzubster-backend',
      audience: 'myzubster-realtime',
      expiresIn: '5m'
    });
    expect(() => verifySocketToken(token)).toThrow('Invalid realtime token purpose');
  });

  test('normalizes only supported namespaces', () => {
    expect(normalizeChannel('user:u1')).toBe('user:u1');
    expect(normalizeChannel('session:s1')).toBe('session:s1');
    expect(normalizeChannel('world:neon-plaza')).toBe('world:neon-plaza');
    expect(normalizeChannel('admin:u1')).toBeNull();
  });

  test('user channels are owner-only unless admin', async () => {
    await expect(authorizeChannel({ channel: 'user:u1', userId: 'u1', role: 'user' })).resolves.toEqual({ allowed: true, channel: 'user:u1' });
    await expect(authorizeChannel({ channel: 'user:u1', userId: 'u2', role: 'user' })).resolves.toEqual({ allowed: false, reason: 'user_channel_forbidden' });
  });

  test('allows the public metaverse world and rejects unknown worlds', async () => {
    await expect(authorizeChannel({ channel: 'world:neon-plaza', userId: 'u1' })).resolves.toEqual({
      allowed: true,
      channel: 'world:neon-plaza'
    });
    await expect(authorizeChannel({ channel: 'world:private-lab', userId: 'u1' })).resolves.toEqual({
      allowed: false,
      reason: 'world_channel_forbidden'
    });
  });

  test('community channels fail closed without membership authority', async () => {
    await expect(authorizeChannel({ channel: 'community:c1', userId: 'u1', role: 'user' })).resolves.toEqual({ allowed: false, reason: 'community_membership_authority_unavailable' });
  });

  test('session channels allow participants and reject outsiders', async () => {
    VirtualSession.findOne.mockReturnValue({
      lean: async () => ({ sessionId: 's1', hostUserId: 'host', participantUserIds: ['u1'] })
    });
    await expect(authorizeChannel({ channel: 'session:s1', userId: 'u1', role: 'user' })).resolves.toEqual({ allowed: true, channel: 'session:s1' });
    await expect(authorizeChannel({ channel: 'session:s1', userId: 'u2', role: 'user' })).resolves.toEqual({ allowed: false, reason: 'session_channel_forbidden' });
  });
});
