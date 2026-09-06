jest.mock('mongoose', () => ({ connection: { readyState: 1 } }));
jest.mock('../models/Notification', () => ({ findOne: jest.fn(), create: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../models/NotificationPreference', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../realtime/realtimeHub', () => ({ emitToUser: jest.fn() }));

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const { emitToUser } = require('../realtime/realtimeHub');
const { createNotification, markRead, setPreference } = require('./notificationService');

beforeEach(() => {
  jest.clearAllMocks();
  NotificationPreference.findOne.mockReturnValue({ lean: async () => null });
});

test('creates one durable notification before realtime emit', async () => {
  Notification.findOne.mockReturnValue({ lean: async () => null });
  Notification.create.mockImplementation(async (value) => ({ ...value, createdAt: new Date('2026-09-06T00:00:00Z'), toObject() { return { ...this }; } }));
  const result = await createNotification({ userId: 'u2', type: 'message', category: 'message', dedupeKey: 'message:m1', payload: { messageId: 'm1' }, deepLink: '/messages/c1' });
  expect(result.valid).toBe(true);
  expect(Notification.create).toHaveBeenCalledTimes(1);
  expect(emitToUser).toHaveBeenCalledWith('u2', 'notification.created', expect.objectContaining({ type: 'message' }));
});

test('dedupe prevents second durable notification and emit', async () => {
  Notification.findOne.mockReturnValue({ lean: async () => ({ notificationId: 'n1', type: 'message', category: 'message', payload: {}, deepLink: '/messages/c1', readAt: null, createdAt: new Date() }) });
  const result = await createNotification({ userId: 'u2', type: 'message', category: 'message', dedupeKey: 'message:m1', deepLink: '/messages/c1' });
  expect(result.duplicate).toBe(true);
  expect(Notification.create).not.toHaveBeenCalled();
  expect(emitToUser).not.toHaveBeenCalled();
});

test('mark read returns refreshed unread count and realtime event', async () => {
  Notification.findOneAndUpdate.mockResolvedValue({ notificationId: 'n1', type: 'message', category: 'message', payload: {}, deepLink: '/messages/c1', readAt: new Date(), createdAt: new Date(), toObject() { return { ...this }; } });
  Notification.countDocuments.mockResolvedValue(2);
  const result = await markRead({ userId: 'u2', notificationId: 'n1' });
  expect(result.unreadCount).toBe(2);
  expect(emitToUser).toHaveBeenCalledWith('u2', 'notification.read', expect.objectContaining({ id: 'n1', unreadCount: 2 }));
});

test('preference hook can disable one category', async () => {
  NotificationPreference.findOneAndUpdate.mockResolvedValue({ category: 'message', inProductEnabled: false });
  const result = await setPreference({ userId: 'u2', category: 'message', inProductEnabled: false });
  expect(result.preference.inProductEnabled).toBe(false);
});
