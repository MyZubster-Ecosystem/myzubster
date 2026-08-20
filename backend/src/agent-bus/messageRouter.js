class MessageRouter {
  constructor() {
    this.routes = new Map();
  }

  register(agentName, handler) {
    if (!agentName || typeof handler !== 'function') {
      throw new Error('agentName and handler are required');
    }
    this.routes.set(agentName, handler);
    return () => this.routes.delete(agentName);
  }

  async dispatch(agentName, message) {
    const handler = this.routes.get(agentName);
    if (!handler) throw new Error(`No handler registered for agent: ${agentName}`);
    return handler(message);
  }

  has(agentName) {
    return this.routes.has(agentName);
  }
}

module.exports = { MessageRouter };
