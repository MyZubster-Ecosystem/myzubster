const { cleanRoomMessage, publicRoomMessage, ROOM_CHAT_RETENTION_MS } = require('./virtualRoomChat');

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

  test('retains room chat for exactly 24 hours', () => {
    expect(ROOM_CHAT_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
  });
});
