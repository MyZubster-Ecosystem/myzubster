class Agent {
  constructor(name, handler) {
    if (!name || typeof handler !== 'function') {
      throw new Error('name and handler are required');
    }
    this.name = name;
    this.handler = handler;
  }

  async run(context) {
    return this.handler(context);
  }
}

module.exports = { Agent };
