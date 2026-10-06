const VirtualRoomMessageReport = require('../models/VirtualRoomMessageReport');
const { cleanRoomMessage, publicRoomMessage, publicRoomMessageWithReportState, canModerateRoomChat, roomChatThrottleKey, aggregateRoomReports, moderateReportedRoomMessage, roomReportThrottleKey, ROOM_REPORT_RATE_LIMIT, ROOM_REPORT_WINDOW_MS, ROOM_CHAT_RETENTION_MS, ROOM_REPORT_RETENTION_MS, ROOM_REPORT_REASONS } = require('./virtualRoomChat');

describe('virtual room chat policy', () => {
  test('sanitizes and limits room messages', () => {
    expect(cleanRoomMessage('  <hello>\u0000 world  ')).toBe('hello world');
    expect(cleanRoomMessage('x'.repeat(400))).toHaveLength(280);
    expect(cleanRoomMessage('   ')).toBe('');
  });

  test('returns a privacy-safe public message', () => {
    const createdAt = new Date('2026-09-15T10:00:00.000Z');
    const message = publicRoomMessage({
      messageId: 'message-1',
      sessionId: 'secret-session',
      senderUserId: 'secret-account',
      characterName: 'H4x0r',
      text: 'Hello room',
      createdAt
    });
    expect(message).toEqual({
      id: 'message-1',
      characterName: 'H4x0r',
      text: 'Hello room',
      createdAt: createdAt.toISOString()
    });
    expect(message).not.toHaveProperty('senderUserId');
    expect(message).not.toHaveProperty('sessionId');
  });

  test('exposes only the authenticated user own report state', () => {
    const message = {
      messageId: 'message-1',
      senderUserId: 'secret-sender',
      characterName: 'H4x0r',
      text: 'Hello room',
      createdAt: '2026-09-16T10:00:00.000Z'
    };
    expect(publicRoomMessageWithReportState(message, new Set(['message-1']), 'other-user')).toEqual({
      id: 'message-1',
      characterName: 'H4x0r',
      text: 'Hello room',
      createdAt: '2026-09-16T10:00:00.000Z',
      reportedByMe: true,
      authoredByMe: false
    });
    expect(publicRoomMessageWithReportState(message, new Set(), 'secret-sender')).toMatchObject({
      reportedByMe: false,
      authoredByMe: true
    });
  });

  test('grants message moderation only to the host or an admin', () => {
    expect(canModerateRoomChat('host', 'host')).toBe(true);
    expect(canModerateRoomChat('admin-user', 'host', 'admin')).toBe(true);
    expect(canModerateRoomChat('participant', 'host')).toBe(false);
    expect(canModerateRoomChat('', 'host')).toBe(false);
  });

  test('scopes chat throttle keys to room, session and account without exposing them', () => {
    const key = roomChatThrottleKey('room-1', 'session-1', 'account-secret');
    expect(key).toHaveLength(64);
    expect(key).not.toContain('account-secret');
    expect(key).not.toBe(roomChatThrottleKey('room-1', 'session-2', 'account-secret'));
    expect(key).not.toBe(roomChatThrottleKey('room-2', 'session-1', 'account-secret'));
  });

  test('uses private fixed-window report throttle buckets', () => {
    const now = new Date('2026-09-16T10:00:30.000Z');
    const key = roomReportThrottleKey('room-1', 'session-1', 'secret-account', now);
    expect(key).toHaveLength(64);
    expect(key).not.toContain('secret-account');
    expect(key).toBe(roomReportThrottleKey('room-1', 'session-1', 'secret-account', new Date('2026-09-16T10:00:59.999Z')));
    expect(key).not.toBe(roomReportThrottleKey('room-1', 'session-1', 'secret-account', new Date('2026-09-16T10:01:00.000Z')));
    expect(ROOM_REPORT_RATE_LIMIT).toBe(10);
    expect(ROOM_REPORT_WINDOW_MS).toBe(60 * 1000);
  });

  test('limits report reasons and evidence retention', () => {
    expect(Array.from(ROOM_REPORT_REASONS)).toEqual(['spam', 'harassment', 'unsafe', 'other']);
    expect(ROOM_REPORT_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  test('exports the coordinated reported-message moderation action', () => {
    expect(typeof moderateReportedRoomMessage).toBe('function');
  });

  test('aggregates duplicate reports without exposing reporters', () => {
    const message = { id: 'message-1', characterName: 'H4x0r', text: 'hello' };
    const reports = aggregateRoomReports([
      { reportId: 'report-1', messageId: 'message-1', reason: 'spam', createdAt: '2026-09-15T10:01:00.000Z', reporterUserId: 'secret-1' },
      { reportId: 'report-2', messageId: 'message-1', reason: 'harassment', createdAt: '2026-09-15T10:00:00.000Z', reporterUserId: 'secret-2' },
      { reportId: 'report-3', messageId: 'message-2', reason: 'other', createdAt: '2026-09-15T10:02:00.000Z', reporterUserId: 'secret-3' }
    ], new Map([['message-1', message]]));
    expect(reports[0]).toEqual({
      id: 'report-1',
      count: 2,
      reasons: ['harassment', 'spam'],
      createdAt: '2026-09-15T10:00:00.000Z',
      message
    });
    expect(JSON.stringify(reports)).not.toContain('secret-');
  });

  test('records only privacy-safe moderation outcomes', () => {
    expect(VirtualRoomMessageReport.schema.path('resolution').enumValues).toEqual(['dismissed', 'message_removed']);
  });

  test('retains room chat for exactly 24 hours', () => {
    expect(ROOM_CHAT_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
  });
});
