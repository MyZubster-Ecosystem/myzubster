const { registerRealtimeIO, emitModerationAction, emitInteractionControl } = require('./realtimeHub');

describe('realtimeHub', () => {
  test('moderation action is emitted to the affected user channel', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    registerRealtimeIO({ to });

    const emitted = emitModerationAction({
      targetUserId: 'u2',
      action: 'warn',
      contextType: 'message',
      contextId: 'm1',
      eventId: 'e1',
      createdAt: new Date('2026-09-06T04:00:00Z')
    });

    expect(emitted).toBe(true);
    expect(to).toHaveBeenCalledWith('user:u2');
    expect(emit).toHaveBeenCalledWith('moderation.action', expect.objectContaining({ action: 'warn', contextId: 'm1', eventId: 'e1' }));
  });

  test('interaction control change is pushed to owner and target', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    registerRealtimeIO({ to });

    emitInteractionControl({ ownerUserId: 'u1', targetUserId: 'u2', kind: 'block', active: true });

    expect(to).toHaveBeenCalledWith('user:u1');
    expect(to).toHaveBeenCalledWith('user:u2');
    expect(emit).toHaveBeenCalledWith('moderation.control_changed', expect.objectContaining({ kind: 'block', active: true }));
  });
});
