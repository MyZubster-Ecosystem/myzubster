const { randomUUID } = require('node:crypto');

class ContextBus {
  constructor() {
    this.events = [];
    this.subscribers = new Map();
  }

  publish({ taskId, from, type, payload = {}, confidence = null, cost = 0, to = 'context-bus' }) {
    if (!taskId || !from || !type) {
      throw new Error('taskId, from and type are required');
    }

    const event = Object.freeze({
      id: randomUUID(),
      taskId,
      from,
      to,
      type,
      payload,
      confidence,
      cost,
      timestamp: new Date().toISOString(),
    });

    this.events.push(event);
    const handlers = this.subscribers.get(type) || [];
    handlers.forEach((handler) => handler(event));
    return event;
  }

  subscribe(type, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const handlers = this.subscribers.get(type) || [];
    handlers.push(handler);
    this.subscribers.set(type, handlers);
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type, handler) {
    const handlers = this.subscribers.get(type) || [];
    this.subscribers.set(type, handlers.filter((item) => item !== handler));
  }

  getTaskEvents(taskId) {
    return this.events.filter((event) => event.taskId === taskId);
  }

  getTaskCost(taskId) {
    return this.getTaskEvents(taskId).reduce((total, event) => total + Number(event.cost || 0), 0);
  }
}

module.exports = { ContextBus };
