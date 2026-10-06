jest.mock('./presenceStore', () => ({
  DEFAULT_TTL_MS: 90000,
  add: jest.fn(),
  touch: jest.fn(),
  remove: jest.fn(),
  list: jest.fn(),
  mode: jest.fn(() => 'redis')
}));
jest.mock('./realtimeModeration', () => ({ deliveryDecision: jest.fn() }));

const presenceStore = require('./presenceStore');
const { deliveryDecision } = require('./realtimeModeration');
const { joinPresence, touchPresence, leavePresence, visibleMembers, presenceMode, STALE_AFTER_MS } = require('./realtimePresence');

describe('realtimePresence', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses 90 second ephemeral TTL and reports redis mode', () => {
    expect(STALE_AFTER_MS).toBe(90000);
    expect(presenceMode()).toBe('redis');
  });

  test('collapses additional connections into the existing logical membership', async () => {
    presenceStore.add.mockResolvedValue({ firstConnection: false, mode: 'redis' });
    const result = await joinPresence({ channel: 'community:c1', userId: 'u1', connectionId: 'socket-2', at: 1000 });
    expect(result.firstConnection).toBe(false);
    expect(result.mode).toBe('redis');
    expect(presenceStore.add).toHaveBeenCalledWith(expect.objectContaining({ ttlMs: 90000 }));
  });

  test('heartbeat refreshes the store TTL', async () => {
    presenceStore.touch.mockResolvedValue(true);
    await expect(touchPresence({ channel: 'session:s1', userId: 'u1', connectionId: 'socket-1' })).resolves.toBe(true);
  });

  test('last connection removal produces a logical leave', async () => {
    presenceStore.remove.mockResolvedValue({ lastConnection: true, mode: 'redis' });
    const result = await leavePresence({ channel: 'user:u1', userId: 'u1', connectionId: 'socket-1', joinedAt: 1000 });
    expect(result.lastConnection).toBe(true);
    expect(result.membership.userId).toBe('u1');
  });

  test('presence snapshot suppresses users blocked or muted by viewer policy', async () => {
    presenceStore.list.mockResolvedValue({
      mode: 'redis',
      members: [
        { userId: 'viewer', joinedAt: 1000 },
        { userId: 'visible', joinedAt: 2000 },
        { userId: 'blocked', joinedAt: 3000 }
      ]
    });
    deliveryDecision.mockImplementation(async ({ senderUserId }) => ({ allowed: senderUserId !== 'blocked' }));
    const result = await visibleMembers({ channel: 'community:c1', viewerUserId: 'viewer' });
    expect(result.members.map((row) => row.userId)).toEqual(['viewer', 'visible']);
  });
});
