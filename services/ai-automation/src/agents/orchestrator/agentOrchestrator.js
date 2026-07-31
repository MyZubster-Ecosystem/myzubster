/**
 * Agent Orchestrator - Coordinates all AI Agents
 * 
 * Manages communication between agents
 * Handles task routing and prioritization
 * Monitors agent health and performance
 */

class AgentOrchestrator {
  constructor(options = {}) {
    this.agents = {
      plant: options.plantAgent || null,
      pet: options.petAgent || null,
      payment: options.paymentAgent || null,
      verification: options.verificationAgent || null
    };
    this.memory = options.memory || null;
    this.config = {
      maxConcurrentTasks: options.maxConcurrentTasks || 10,
      taskTimeout: options.taskTimeout || 60000,
      retryAttempts: options.retryAttempts || 3
    };
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.taskHistory = [];
  }

  async executeTask(task) {
    const { type, data, priority = 1 } = task;
    const agent = this.getAgentForTask(type);
    if (!agent) {
      throw new Error(`No agent available for task type: ${type}`);
    }

    const taskId = this.generateTaskId();
    this.activeTasks.set(taskId, { task, status: 'running', started: new Date() });

    try {
      const result = await agent[type](data);
      this.activeTasks.set(taskId, { ...this.activeTasks.get(taskId), status: 'completed', result });
      this.taskHistory.push({ taskId, type, status: 'completed', timestamp: new Date() });
      return result;
    } catch (error) {
      this.activeTasks.set(taskId, { ...this.activeTasks.get(taskId), status: 'failed', error: error.message });
      this.taskHistory.push({ taskId, type, status: 'failed', timestamp: new Date(), error: error.message });
      throw error;
    } finally {
      setTimeout(() => this.activeTasks.delete(taskId), 60000);
    }
  }

  getAgentForTask(type) {
    const agentMap = {
      'identifyPlant': 'plant',
      'monitorGrowth': 'plant',
      'verifyPlant': 'plant',
      'calculateConservationImpact': 'plant',
      'readNfcTag': 'pet',
      'trackLocation': 'pet',
      'monitorHealth': 'pet',
      'lostPetRecovery': 'pet',
      'processXMRTransaction': 'payment',
      'calculateFees': 'payment',
      'distributeReward': 'payment',
      'detectFraud': 'payment',
      'verifyPlant': 'verification',
      'verifyPet': 'verification',
      'analyzeCommunityVotes': 'verification',
      'calculateQualityScore': 'verification'
    };
    const agentKey = agentMap[type];
    return this.agents[agentKey];
  }

  addTaskToQueue(task) {
    this.taskQueue.push(task);
    return task;
  }

  async processQueue() {
    const results = [];
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrentTasks) {
      const task = this.taskQueue.shift();
      try {
        const result = await this.executeTask(task);
        results.push({ task, result, status: 'success' });
      } catch (error) {
        results.push({ task, error: error.message, status: 'failed' });
      }
    }
    return results;
  }

  getStatus() {
    return {
      agents: Object.keys(this.agents).reduce((acc, key) => {
        if (this.agents[key]) {
          acc[key] = this.agents[key].getStatus();
        } else {
          acc[key] = 'not configured';
        }
        return acc;
      }, {}),
      activeTasks: this.activeTasks.size,
      queueLength: this.taskQueue.length,
      memory: this.memory ? this.memory.getStats() : 'not configured',
      config: this.config
    };
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }
}

module.exports = AgentOrchestrator;
