const { randomUUID } = require('node:crypto');
const { Agent } = require('../agents/agent');
const { ContextBus } = require('../agent-bus/contextBus');
const { MessageRouter } = require('../agent-bus/messageRouter');

class MultiAgentWorkflow {
  constructor({ agents = {} } = {}) {
    this.bus = new ContextBus();
    this.router = new MessageRouter();
    this.agents = new Map();

    Object.entries(agents).forEach(([name, handler]) => this.registerAgent(name, handler));
  }

  registerAgent(name, handler) {
    const agent = handler instanceof Agent ? handler : new Agent(name, handler);
    this.agents.set(name, agent);
    this.router.register(name, (context) => agent.run(context));
    return agent;
  }

  async run(task, { taskId = randomUUID() } = {}) {
    if (!task) throw new Error('task is required');

    this.bus.publish({ taskId, from: 'supervisor', type: 'task.started', payload: { task } });

    const stages = ['researcher', 'builder', 'analyst', 'critic'];
    let context = { task, taskId, findings: [], artifacts: [], analysis: null, critique: null };

    for (const stage of stages) {
      if (!this.router.has(stage)) continue;
      const result = await this.router.dispatch(stage, context);
      context = { ...context, [stage]: result };
      this.bus.publish({
        taskId,
        from: stage,
        type: `agent.${stage}.completed`,
        payload: result,
      });
    }

    let final = context.critic || context.analyst || context.builder || context.researcher || null;
    if (this.router.has('finalizer')) {
      final = await this.router.dispatch('finalizer', context);
      this.bus.publish({ taskId, from: 'finalizer', type: 'task.completed', payload: final });
    } else {
      this.bus.publish({ taskId, from: 'supervisor', type: 'task.completed', payload: final });
    }

    return {
      taskId,
      result: final,
      events: this.bus.getTaskEvents(taskId),
      estimatedCost: this.bus.getTaskCost(taskId),
    };
  }
}

module.exports = { MultiAgentWorkflow };
