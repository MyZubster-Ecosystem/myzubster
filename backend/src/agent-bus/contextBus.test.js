const { ContextBus } = require('./contextBus');

describe('ContextBus', () => {
  test('publishes auditable events and calculates task cost', () => {
    const bus = new ContextBus();
    const event = bus.publish({
      taskId: 'task-1',
      from: 'researcher',
      type: 'finding',
      payload: { answer: 42 },
      confidence: 0.9,
      cost: 0.012,
    });

    expect(event.taskId).toBe('task-1');
    expect(event.from).toBe('researcher');
    expect(event.timestamp).toBeTruthy();
    expect(bus.getTaskEvents('task-1')).toHaveLength(1);
    expect(bus.getTaskCost('task-1')).toBeCloseTo(0.012);
  });

  test('rejects incomplete events', () => {
    const bus = new ContextBus();
    expect(() => bus.publish({ taskId: 'task-1' })).toThrow();
  });
});
