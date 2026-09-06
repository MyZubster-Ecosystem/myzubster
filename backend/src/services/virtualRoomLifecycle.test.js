const {
  ROOM_TRANSITIONS,
  validateJoin,
  publicRoom,
  publicSession
} = require('./virtualRoomLifecycle');

describe('virtual room lifecycle policy', () => {
  test('allows only forward authoritative room transitions', () => {
    expect(ROOM_TRANSITIONS.draft.has('published')).toBe(true);
    expect(ROOM_TRANSITIONS.published.has('scheduled')).toBe(true);
    expect(ROOM_TRANSITIONS.scheduled.has('live')).toBe(true);
    expect(ROOM_TRANSITIONS.live.has('ended')).toBe(true);
    expect(ROOM_TRANSITIONS.ended.has('archive')).toBe(true);
    expect(ROOM_TRANSITIONS.ended.has('live')).toBe(false);
    expect(ROOM_TRANSITIONS.archive.size).toBe(0);
  });

  test('blocks joins when session is not live', async () => {
    const result = await validateJoin({
      session: { state: 'ended', participantUserIds: [], capacity: 10 },
      room: { blockedUserIds: [], allowedUserIds: [], accessPolicy: 'public', hostUserId: 'host' },
      actorUserId: 'user-1'
    });
    expect(result).toMatchObject({ valid: false, status: 409 });
  });

  test('enforces room blocklist', async () => {
    const result = await validateJoin({
      session: { state: 'live', participantUserIds: [], capacity: 10 },
      room: { blockedUserIds: ['user-1'], allowedUserIds: [], accessPolicy: 'public', hostUserId: 'host' },
      actorUserId: 'user-1'
    });
    expect(result).toMatchObject({ valid: false, status: 403, error: 'Access blocked' });
  });

  test('enforces private allowlist while allowing host', async () => {
    const denied = await validateJoin({
      session: { state: 'live', participantUserIds: [], capacity: 10 },
      room: { blockedUserIds: [], allowedUserIds: ['allowed'], accessPolicy: 'private', hostUserId: 'host' },
      actorUserId: 'other'
    });
    expect(denied.status).toBe(403);

    const host = await validateJoin({
      session: { state: 'live', participantUserIds: [], capacity: 10 },
      room: { blockedUserIds: [], allowedUserIds: [], accessPolicy: 'private', hostUserId: 'host' },
      actorUserId: 'host'
    });
    expect(host.valid).toBe(true);
  });

  test('enforces capacity for new participants but permits existing participant', async () => {
    const full = await validateJoin({
      session: { state: 'live', participantUserIds: ['u1'], capacity: 1 },
      room: { blockedUserIds: [], allowedUserIds: [], accessPolicy: 'public', hostUserId: 'host' },
      actorUserId: 'u2'
    });
    expect(full.status).toBe(409);

    const existing = await validateJoin({
      session: { state: 'live', participantUserIds: ['u1'], capacity: 1 },
      room: { blockedUserIds: [], allowedUserIds: [], accessPolicy: 'public', hostUserId: 'host' },
      actorUserId: 'u1'
    });
    expect(existing.valid).toBe(true);
  });

  test('public views exclude host ids, blocklists and participant ids', () => {
    const room = publicRoom({
      roomId: 'room-1', slug: 'room', name: 'Room', hostUserId: 'secret-host', state: 'live',
      accessPolicy: 'public', capacity: 50, stagePolicy: 'host-only', sceneManifestVersion: '7',
      blockedUserIds: ['blocked'], allowedUserIds: ['allowed']
    });
    const session = publicSession({
      sessionId: 'session-1', roomId: 'room-1', hostUserId: 'secret-host', state: 'live', capacity: 50,
      participantUserIds: ['a', 'b'], sceneManifestVersion: '7', lifecycleVersion: 3
    });

    expect(room).not.toHaveProperty('hostUserId');
    expect(room).not.toHaveProperty('blockedUserIds');
    expect(room).not.toHaveProperty('allowedUserIds');
    expect(session).not.toHaveProperty('participantUserIds');
    expect(session.participantCount).toBe(2);
  });
});
