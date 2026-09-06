jest.mock('mongoose', () => ({ connection: { readyState: 1 } }));
jest.mock('../models/InteractionControl', () => ({ findOneAndUpdate: jest.fn(), find: jest.fn() }));
jest.mock('../models/ModerationReport', () => ({ create: jest.fn() }));
jest.mock('../models/ModerationEvent', () => ({ create: jest.fn(), find: jest.fn() }));

const InteractionControl = require('../models/InteractionControl');
const ModerationReport = require('../models/ModerationReport');
const ModerationEvent = require('../models/ModerationEvent');
const {
  setInteractionControl,
  deliveryDecision,
  createReport,
  moderationAction
} = require('./realtimeModeration');

beforeEach(() => {
  jest.clearAllMocks();
  ModerationEvent.create.mockImplementation(async (value) => ({ ...value, createdAt: new Date() }));
});

test('persists block control and audit event', async () => {
  InteractionControl.findOneAndUpdate.mockResolvedValue({ targetUserId: 'u2', kind: 'block', active: true });
  const result = await setInteractionControl({ ownerUserId: 'u1', targetUserId: 'u2', kind: 'block', active: true });
  expect(result.valid).toBe(true);
  expect(result.control).toEqual({ targetUserId: 'u2', kind: 'block', active: true });
  expect(ModerationEvent.create).toHaveBeenCalled();
});

test('delivery decision blocks when recipient blocked sender', async () => {
  InteractionControl.find.mockReturnValue({ lean: async () => [{ ownerUserId: 'u2', targetUserId: 'u1', kind: 'block', active: true }] });
  const result = await deliveryDecision({ senderUserId: 'u1', recipientUserId: 'u2' });
  expect(result.allowed).toBe(false);
  expect(result.status).toBe('blocked');
});

test('report creation sanitizes and persists context', async () => {
  ModerationReport.create.mockImplementation(async (value) => ({ ...value, reportId: 'r1', status: 'open' }));
  const result = await createReport({ reporterUserId: 'u1', targetUserId: 'u2', contextType: 'message', contextId: 'm1', reason: '<b>spam</b>' });
  expect(result.valid).toBe(true);
  expect(result.report.id).toBe('r1');
  expect(ModerationReport.create.mock.calls[0][0].reason).not.toContain('<');
});

test('non moderator cannot execute privileged action', async () => {
  const result = await moderationAction({ moderatorUserId: 'u1', moderatorRole: 'user', targetUserId: 'u2', action: 'suspend' });
  expect(result.valid).toBe(false);
  expect(result.status).toBe(403);
  expect(ModerationEvent.create).not.toHaveBeenCalled();
});
