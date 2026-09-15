const {
  ROOM_TRANSITIONS,
  canCancelSessionState,
  hashRoomInviteCode,
  validateScheduledFor,
  publicInviteStatus,
  roomInviteRedemptionQuery,
  moderationParticipantRef,
  blockedParticipantRef,
  roomDiscoveryQuery,
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
    expect(ROOM_TRANSITIONS.live.has('published')).toBe(false);
  });

  test('hashes private invitation codes deterministically without storing the code', () => {
    const first = hashRoomInviteCode('one-time-code');
    expect(first).toBe(hashRoomInviteCode('one-time-code'));
    expect(first).toHaveLength(64);
    expect(first).not.toContain('one-time-code');
  });

  test('reports only safe invitation status and expires stale invitations', () => {
    const future = new Date(Date.now() + 60_000);
    const active = publicInviteStatus({ inviteTokenHash: 'hash', inviteExpiresAt: future });
    expect(active).toEqual({ active: true, expiresAt: future.toISOString() });
    expect(active).not.toHaveProperty('inviteTokenHash');
    expect(publicInviteStatus({ inviteTokenHash: 'hash', inviteExpiresAt: new Date(0) })).toEqual({
      active: false,
      expiresAt: null
    });
  });

  test('builds an atomic invite claim that binds hash, expiry and block status', () => {
    const now = new Date('2026-09-15T00:00:00.000Z');
    expect(roomInviteRedemptionQuery({
      roomId: 'room-1',
      suppliedHash: 'hash',
      actorUserId: 'user-1',
      now
    })).toEqual({
      roomId: 'room-1',
      accessPolicy: 'private',
      inviteTokenHash: 'hash',
      inviteExpiresAt: { $gt: now },
      blockedUserIds: { $ne: 'user-1' }
    });
  });

  test('creates stable opaque moderation references without exposing account ids', () => {
    const ref = moderationParticipantRef('session-1', 'account-secret');
    expect(ref).toBe(moderationParticipantRef('session-1', 'account-secret'));
    expect(ref).toHaveLength(24);
    expect(ref).not.toContain('account-secret');
    expect(ref).not.toBe(moderationParticipantRef('session-2', 'account-secret'));
  });

  test('scopes opaque blocklist references to the room', () => {
    const ref = blockedParticipantRef('room-1', 'account-secret');
    expect(ref).toHaveLength(24);
    expect(ref).not.toContain('account-secret');
    expect(ref).not.toBe(blockedParticipantRef('room-2', 'account-secret'));
  });

  test('public session views do not expose stage request or speaker account ids', () => {
    const view = publicSession({ sessionId: 's', roomId: 'r', state: 'live', capacity: 5, participantUserIds: [], stageRequestUserIds: ['secret'], stageSpeakerUserIds: ['secret'], lifecycleVersion: 1 });
    expect(view).not.toHaveProperty('stageRequestUserIds');
    expect(view).not.toHaveProperty('stageSpeakerUserIds');
  });

  test('keeps stage membership private in public session snapshots', () => {
    const session = publicSession({ sessionId: 's', roomId: 'r', state: 'live', capacity: 5, participantUserIds: ['u'], stageSpeakerUserIds: ['u'], lifecycleVersion: 2 });
    expect(session.participantCount).toBe(1);
    expect(session).not.toHaveProperty('stageSpeakerUserIds');
  });

  test('accepts optional future schedules and rejects invalid or past dates', () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    expect(validateScheduledFor(undefined, now)).toEqual({ valid: true, unchanged: true });
    expect(validateScheduledFor(null, now)).toEqual({ valid: true, date: null });
    expect(validateScheduledFor('invalid', now).valid).toBe(false);
    expect(validateScheduledFor('2026-09-15T11:59:00.000Z', now).valid).toBe(false);
    expect(validateScheduledFor('2026-09-15T13:00:00.000Z', now).date.toISOString()).toBe('2026-09-15T13:00:00.000Z');
  });

  test('allows cancellation only before a scheduled session starts', () => {
    expect(canCancelSessionState('scheduled')).toBe(true);
    expect(canCancelSessionState('live')).toBe(false);
    expect(canCancelSessionState('ended')).toBe(false);
    expect(canCancelSessionState('archive')).toBe(false);
  });

  test('discovers only active lifecycle states and never exposes private rooms', () => {
    expect(roomDiscoveryQuery(false)).toEqual({
      state: { $in: ['published', 'scheduled', 'live'] },
      accessPolicy: 'public'
    });
    expect(roomDiscoveryQuery(true)).toEqual({
      state: { $in: ['published', 'scheduled', 'live'] },
      accessPolicy: { $in: ['public', 'authenticated'] }
    });
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
