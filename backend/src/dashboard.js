/**
 * Dashboard data provider for MyZubster AI Automation system
 */

const { AgentOrchestrator, LongTermMemory, PlantAgent, PetAgent, PaymentAgent, VerificationAgent } = require('../../src/agents');

// Initialize agents with mock skills (same pattern as tests)
const mockGemmaSkill = {
  process: async (input) => {
    let result = {
      success: true,
      data: { ...input, processed: true, confidence: 0.95, timestamp: new Date().toISOString() }
    };

    if (input.structure && input.amount) {
      return {
        creator: input.amount * 0.02,
        conservation: input.amount * 0.05,
        operations: input.amount * 0.93,
        total: input.amount
      };
    }

    if (input.votes) {
      const total = input.votes.length;
      const positive = input.votes.filter(v => v === 'upvote').length;
      return {
        itemId: input.itemId,
        totalVotes: total,
        positiveVotes: positive,
        negativeVotes: total - positive,
        score: total > 0 ? positive / total : 0,
        status: (total > 0 && positive / total >= 0.7) ? 'verified' : 'pending'
      };
    }

    if (input.metrics) {
      return {
        score: 0.85,
        status: 'high',
        details: { dataQuality: 'good', completeness: 'complete' }
      };
    }

    return result;
  }
};

// Initialize memory and agents once
let memory;
let orchestrator;

try {
  memory = new LongTermMemory({ namespace: 'dashboard', cacheTTL: 30000 });
  
  const plantAgent = new PlantAgent({
    memory,
    recognition: mockGemmaSkill,
    monitoring: mockGemmaSkill,
    verification: mockGemmaSkill,
    conservation: mockGemmaSkill
  });
  
  const petAgent = new PetAgent({
    memory,
    nfcReading: mockGemmaSkill,
    gpsTracking: mockGemmaSkill,
    healthMonitoring: mockGemmaSkill,
    lostPetRecovery: mockGemmaSkill
  });
  
  const paymentAgent = new PaymentAgent({
    memory,
    xmrProcessing: mockGemmaSkill,
    feeCalculation: mockGemmaSkill,
    rewardDistribution: mockGemmaSkill,
    fraudDetection: mockGemmaSkill
  });
  
  const verificationAgent = new VerificationAgent({
    memory,
    plantVerification: mockGemmaSkill,
    petVerification: mockGemmaSkill,
    communityVoting: mockGemmaSkill,
    qualityScoring: mockGemmaSkill
  });
  
  orchestrator = new AgentOrchestrator({
    plantAgent,
    petAgent,
    paymentAgent,
    verificationAgent,
    memory
  });
} catch (error) {
  console.error('Failed to initialize AI Agents for dashboard:', error.message);
}

// Sample bounties data (in-memory)
const activeBounties = [
  {
    id: 'bounty-001',
    title: 'Implement Telegram bot integration for MyZubster',
    description: 'Create a Telegram bot to receive and process plant/pet registration updates.',
    reward: 0.5,
    currency: 'XMR',
    status: 'open',
    labels: ['telegram', 'bot', 'integration'],
    createdAt: '2026-07-15T10:00:00Z',
    expiresAt: '2026-08-15T10:00:00Z',
    assignee: null
  },
  {
    id: 'bounty-002',
    title: 'Add GitHub webhook handler for automated issue tracking',
    description: 'Implement webhook receiver to sync GitHub issues with the internal task queue.',
    reward: 0.3,
    currency: 'XMR',
    status: 'in-progress',
    labels: ['github', 'webhook', 'automation'],
    createdAt: '2026-07-20T14:30:00Z',
    expiresAt: '2026-08-20T14:30:00Z',
    assignee: 'foxxx009'
  },
  {
    id: 'bounty-003',
    title: 'Improve AI verification confidence scoring',
    description: 'Refine the Gemma-based verification pipeline to reduce false positives.',
    reward: 0.8,
    currency: 'XMR',
    status: 'open',
    labels: ['ai', 'verification', 'gemma'],
    createdAt: '2026-07-25T09:15:00Z',
    expiresAt: '2026-09-01T09:15:00Z',
    assignee: null
  },
  {
    id: 'bounty-004',
    title: 'Create web dashboard for system monitoring',
    description: 'Build a real-time dashboard to visualize AI Automation system status.',
    reward: 1.2,
    currency: 'XMR',
    status: 'claimed',
    labels: ['dashboard', 'monitoring', 'express'],
    createdAt: '2026-07-10T11:00:00Z',
    expiresAt: '2026-08-10T11:00:00Z',
    assignee: 'foxxx009'
  }
];

// Generate sample recent analyzed issues based on agent task history
function getRecentIssues() {
  const issues = [];
  const now = Date.now();
  
  // If orchestrator has history, use it; otherwise generate sample data
  if (orchestrator && orchestrator.taskHistory && orchestrator.taskHistory.length > 0) {
    return orchestrator.taskHistory.slice(-10).reverse().map(task => ({
      id: task.taskId || `task-${Math.random().toString(36).substr(2, 9)}`,
      type: task.type || 'unknown',
      status: task.status || 'unknown',
      timestamp: task.timestamp || new Date().toISOString(),
      error: task.error || null
    }));
  }
  
  // Sample issues representing analyzed GitHub-style issues
  const sampleTypes = [
    'identifyPlant', 'monitorGrowth', 'verifyPlant', 'readNfcTag',
    'trackLocation', 'monitorHealth', 'processXMRTransaction', 'detectFraud'
  ];
  
  for (let i = 0; i < 8; i++) {
    const type = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
    const statuses = ['completed', 'completed', 'completed', 'failed', 'pending'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    issues.push({
      id: `issue-${1000 + i}`,
      type,
      status,
      timestamp: new Date(now - i * 3600000 * Math.random() * 5).toISOString(),
      error: status === 'failed' ? 'Processing timeout after 30s' : null
    });
  }
  
  return issues;
}

// Service health checks (simulated for Telegram and GitHub since no actual integrations exist)
function getServiceStatus() {
  const now = new Date().toISOString();
  
  // Telegram service status - simulated
  const telegramStatus = {
    name: 'Telegram Bot',
    status: 'online',
    lastCheck: now,
    latency: Math.floor(Math.random() * 80) + 20 + 'ms',
    details: {
      botUsername: '@MyZubster_bot',
      webhook: 'configured',
      lastUpdate: new Date(Date.now() - 300000).toISOString()
    }
  };
  
  // GitHub service status - simulated
  const githubStatus = {
    name: 'GitHub Integration',
    status: 'online',
    lastCheck: now,
    latency: Math.floor(Math.random() * 150) + 50 + 'ms',
    details: {
      repo: 'MyZubster-Ecosystem/myzubster',
      webhooks: 'active',
      lastSync: new Date(Date.now() - 600000).toISOString()
    }
  };
  
  // AI service status - real from orchestrator
  let aiStatus = {
    name: 'AI Automation System',
    status: 'online',
    lastCheck: now,
    latency: '<10ms',
    agents: 0,
    details: {}
  };
  
  if (orchestrator) {
    const status = orchestrator.getStatus();
    const agentCount = Object.keys(status.agents).filter(k => status.agents[k] !== 'not configured').length;
    aiStatus.agents = agentCount;
    aiStatus.details = {
      activeTasks: status.activeTasks,
      queueLength: status.queueLength,
      agents: status.agents
    };
    aiStatus.status = agentCount > 0 ? 'online' : 'degraded';
  }
  
  return {
    telegram: telegramStatus,
    github: githubStatus,
    ai: aiStatus
  };
}

function getDashboardData() {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    services: getServiceStatus(),
    recentIssues: getRecentIssues(),
    activeBounties: activeBounties.map(b => ({
      id: b.id,
      title: b.title,
      reward: `${b.reward} ${b.currency}`,
      status: b.status,
      labels: b.labels,
      assignee: b.assignee,
      expiresAt: b.expiresAt
    }))
  };
}

module.exports = {
  getDashboardData,
  getServiceStatus,
  getRecentIssues,
  activeBounties
};
