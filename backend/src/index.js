require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Dashboard API endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    services: [
      {
        name: "telegram",
        status: 'online',
        latency: '120ms',
        description: 'Telegram bot service',
        endpoint: 'http://localhost:3000'
      },
      {
        name: "github",
        status: 'online',
        latency: '80ms',
        description: 'GitHub API integration',
        endpoint: 'https://api.github.com'
      },
      {
        name: "ai",
        status: 'online',
        latency: '200ms',
        description: 'AI Orchestrator service',
        endpoint: 'http://localhost:3008/api/ai'
      },
      {
        name: "mongodb",
        status: mongoose.connection.readyState === 1 ? 'online' : 'offline',
        latency: '10ms',
        description: 'Database service',
        endpoint: 'mongodb://localhost:27017'
      }
    ],
    recentIssues: [
      {
        id: 48,
        title: '[Enhancement] Migliorare l\'analisi AI con prompt engineering',
        status: 'closed',
        created_at: '2026-07-31T10:00:00.000Z',
        priority: 'high'
      },
      {
        id: 47,
        title: 'Dashboard web per monitorare il sistema',
        status: 'closed',
        created_at: '2026-07-30T15:30:00.000Z',
        priority: 'medium'
      },
      {
        id: 45,
        title: 'Bug: Mappa non si carica correttamente',
        status: 'open',
        created_at: '2026-07-29T12:00:00.000Z',
        priority: 'critical'
      }
    ],
    activeBounties: [
      {
        id: 3,
        title: 'Fix security vulnerability in authentication',
        reward: '0.5 XMR',
        status: 'active',
        assignee: 'alice_dev'
      },
      {
        id: 5,
        title: 'Implement rate limiting for API',
        reward: '0.3 XMR',
        status: 'active',
        assignee: 'bob_coder'
      }
    ],
    stats: {
      totalIssues: 156,
      openIssues: 23,
      closedIssues: 133,
      totalBounties: 12,
      activeBounties: 4,
      totalContributors: 18
    }
  });
});

// Endpoint per i messaggi (aggiunto per il test)
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock dei messaggi
    const messages = [
      {
        id: 'msg1',
        userId: userId,
        content: 'Benvenuto su MyZubster! 🌱',
        timestamp: new Date().toISOString(),
        type: 'welcome',
        read: false
      },
      {
        id: 'msg2',
        userId: userId,
        content: 'Hai nuovi aggiornamenti disponibili per il sistema',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'update',
        read: true
      },
      {
        id: 'msg3',
        userId: userId,
        content: 'Il tuo bounty "Fix security vulnerability" è stato approvato!',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'bounty',
        read: false
      }
    ];
    
    res.json({
      success: true,
      userId: userId,
      messages: messages,
      count: messages.length,
      unread: messages.filter(m => !m.read).length
    });
  } catch (error) {
    console.error('Errore nel recupero dei messaggi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei messaggi',
      message: error.message
    });
  }
});

// Dashboard HTML page
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MyZubster Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-online { color: #27ae60; }
        .status-offline { color: #e74c3c; }
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .badge-open { background: #3498db; color: white; }
        .badge-closed { background: #95a5a6; color: white; }
        .badge-critical { background: #e74c3c; color: white; }
        .badge-high { background: #e67e22; color: white; }
        .badge-medium { background: #f39c12; color: white; }
        .badge-active { background: #27ae60; color: white; }
        .issue-list, .bounty-list {
          list-style: none;
          padding: 0;
        }
        .issue-item, .bounty-item {
          background: white;
          margin: 10px 0;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
        }
        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
          margin-top: 5px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }
        .refresh-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .refresh-btn:hover {
          background: #2980b9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 MyZubster Dashboard</h1>
        <p>Last updated: <span id="timestamp">${new Date().toISOString()}</span></p>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number" id="totalIssues">156</div>
            <div class="stat-label">Total Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="openIssues">23</div>
            <div class="stat-label">Open Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="closedIssues">133</div>
            <div class="stat-label">Closed Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="activeBounties">4</div>
            <div class="stat-label">Active Bounties</div>
          </div>
        </div>

        <h2>🔧 Service Status</h2>
        <div class="status-grid" id="services">
          <div class="card">
            <h3>Telegram</h3>
            <p><span class="status-online">●</span> Online (120ms)</p>
          </div>
          <div class="card">
            <h3>GitHub</h3>
            <p><span class="status-online">●</span> Online (80ms)</p>
          </div>
          <div class="card">
            <h3>AI Orchestrator</h3>
            <p><span class="status-online">●</span> Online (200ms)</p>
          </div>
          <div class="card">
            <h3>MongoDB</h3>
            <p><span class="status-online">●</span> Connected</p>
          </div>
        </div>

        <h2>📋 Recent Issues</h2>
        <ul class="issue-list">
          <li class="issue-item">
            <strong>[Enhancement] Migliorare l'analisi AI con prompt engineering</strong>
            <span class="badge badge-closed">Closed</span>
            <span style="float:right; color:#7f8c8d;">2026-07-31</span>
          </li>
          <li class="issue-item">
            <strong>Dashboard web per monitorare il sistema</strong>
            <span class="badge badge-closed">Closed</span>
            <span style="float:right; color:#7f8c8d;">2026-07-30</span>
          </li>
          <li class="issue-item">
            <strong>Bug: Mappa non si carica correttamente</strong>
            <span class="badge badge-open">Open</span>
            <span class="badge badge-critical">Critical</span>
            <span style="float:right; color:#7f8c8d;">2026-07-29</span>
          </li>
        </ul>

        <h2>💰 Active Bounties</h2>
        <ul class="bounty-list">
          <li class="bounty-item">
            <strong>Fix security vulnerability in authentication</strong>
            <span class="badge badge-active">0.5 XMR</span>
            <span style="margin-left:10px; color:#7f8c8d;">Assignee: alice_dev</span>
          </li>
          <li class="bounty-item">
            <strong>Implement rate limiting for API</strong>
            <span class="badge badge-active">0.3 XMR</span>
            <span style="margin-left:10px; color:#7f8c8d;">Assignee: bob_coder</span>
          </li>
        </ul>

        <div class="footer">
          <p>MyZubster Dashboard v1.0.0 | <a href="/api/dashboard">API JSON</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ MyZubster backend listening on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📍 API Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`📍 Messages: http://localhost:${PORT}/api/messages/:userId`);
});

module.exports = app;
