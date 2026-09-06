jest.mock('../models/VirtualSessionEvent', () => ({
  findOneAndUpdate: jest.fn(),
  find: jest.fn()
}));

const mongoose = require('mongoose');
const VirtualSessionEvent = require('../models/VirtualSessionEvent');
const { appendSessionEvent, listSessionEvents, publicEvent } = require('./virtualSessionEvents');

describe('virtualSessionEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
  });

  test('publishes only bounded aggregate event fields', () => {
    const value = publicEvent({
      eventId: 'event-1',
      sessionId: 'session-1',
      roomId: 'room-1',
      sequence: 3,
      type: 'participant_joined',
      state: 'live',
      participantCount: 12,
      sceneManifestVersion: '7',
      createdAt: new Date('2026-09-06T00:00:00Z'),
      participantUserIds: ['private-user'],
      hostUserId: 'private-host'
    });

    expect(value).toEqual({
      id: 'event-1',
      sessionId: 'session-1',
      roomId: 'room-1',
      sequence: 3,
      type: 'participant_joined',
      state: 'live',
      participantCount: 12,
      sceneManifestVersion: '7',
      createdAt: '2026-09-06T00:00:00.000Z'
    });
    expect(JSON.stringify(value)).not.toMatch(/private-user|private-host|participantUserIds|hostUserId/);
  });

  test('uses session lifecycleVersion as an idempotent event cursor', async () => {
    VirtualSessionEvent.findOneAndUpdate.mockResolvedValue({
      eventId: 'event-2', sessionId: 'session-1', roomId: 'room-1', sequence: 4,
      type: 'session_started', state: 'live', participantCount: 0,
      sceneManifestVersion: '1', createdAt: new Date('2026-09-06T00:00:00Z')
    });

    await appendSessionEvent({
      session: { id: 'session-1', roomId: 'room-1', lifecycleVersion: 4, state: 'live', participantCount: 0, sceneManifestVersion: '1' },
      type: 'session_started'
    });

    expect(VirtualSessionEvent.findOneAndUpdate).toHaveBeenCalledWith(
      { sessionId: 'session-1', sequence: 4 },
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ type: 'session_started', participantCount: 0 }) }),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  test('returns ordered events after a cursor for serverless polling', async () => {
    const lean = jest.fn().mockResolvedValue([
      { eventId: 'e3', sessionId: 's1', roomId: 'r1', sequence: 3, type: 'participant_joined', state: 'live', participantCount: 1, sceneManifestVersion: '1', createdAt: new Date() },
      { eventId: 'e4', sessionId: 's1', roomId: 'r1', sequence: 4, type: 'session_ended', state: 'ended', participantCount: 1, sceneManifestVersion: '1', createdAt: new Date() }
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    VirtualSessionEvent.find.mockReturnValue({ sort });

    const result = await listSessionEvents({ sessionId: 's1', after: 2, limit: 50 });

    expect(VirtualSessionEvent.find).toHaveBeenCalledWith({ sessionId: 's1', sequence: { $gt: 2 } });
    expect(result.status).toBe('ok');
    expect(result.transport).toBe('persistent-polling');
    expect(result.cursor).toBe(4);
    expect(result.events.map((event) => event.sequence)).toEqual([3, 4]);
  });

  test('degrades explicitly when persistent storage is unavailable', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
    await expect(listSessionEvents({ sessionId: 's1', after: 7 })).resolves.toMatchObject({
      status: 'unavailable',
      cursor: 7,
      retryRecommended: true,
      events: []
    });
  });
});
