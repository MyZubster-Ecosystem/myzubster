const { MultiAgentWorkflow } = require('./workflow');

describe('MultiAgentWorkflow', () => {
  test('runs the five-agent path and returns an auditable result', async () => {
    const calls = [];
    const handler = (name) => async (context) => {
      calls.push(name);
      return { stage: name, taskId: context.taskId };
    };

    const workflow = new MultiAgentWorkflow({
      agents: {
        researcher: handler('researcher'),
        builder: handler('builder'),
        analyst: handler('analyst'),
        critic: handler('critic'),
        finalizer: handler('finalizer'),
      },
    });

    const result = await workflow.run('compare two approaches', { taskId: 'task-test' });

    expect(calls).toEqual(['researcher', 'builder', 'analyst', 'critic', 'finalizer']);
    expect(result.taskId).toBe('task-test');
    expect(result.result.stage).toBe('finalizer');
    expect(result.events.length).toBeGreaterThanOrEqual(6);
  });
});
