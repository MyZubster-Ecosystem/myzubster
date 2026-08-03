require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const gardenRoutes = require('./routes/gardens');
const photoRoutes = require('./routes/photos');
const reminderRoutes = require('./routes/reminders');
const daoRoutes = require('./routes/dao');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Garden routes
app.use('/api/gardens', gardenRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dao', daoRoutes);

// Dashboard API endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    services: [
      {
        name: 'telegram',
        status: 'online',
        latency: '120ms',
        description: 'Telegram bot service',
        endpoint: 'http://localhost:3000'
      },
      {
        name: 'slack',
        status: process.env.SLACK_WEBHOOK_URL ? 'online' : 'offline',
        latency: process.env.SLACK_WEBHOOK_URL ? '150ms' : 'N/A',
        description: 'Slack notification service',
        endpoint: process.env.SLACK_WEBHOOK_URL || 'Not configured'
      },
      {
        name: 'github',
        status: 'online',
        latency: '80ms',
        description: 'GitHub API integration',
        endpoint: 'https://api.github.com'
      },
      {
        name: 'ai',
        status: 'online',
        latency: '200ms',
        description: 'AI Orchestrator service',
        endpoint: 'http://localhost:3009/api/ai'
      },
      {
        name: 'geocoding',
        status: 'online',
        latency: '250ms',
        description: 'OpenStreetMap Nominatim',
        endpoint: 'https://nominatim.openstreetmap.org'
      },
      {
        name: 'mongodb',
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
      },
      {
        id: 17,
        title: 'Geolocalizzazione e ricerca per area gardens',
        reward: '0.06 XMR',
        status: 'merged',
        assignee: 'leanworld7-netizen'
      }
    ],
    stats: {
      totalIssues: 156,
      openIssues: 23,
      closedIssues: 133,
      totalBounties: 12,
      activeBounties: 4,
      totalContributors: 19
    }
  });
});

// Messages endpoint
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = [
      {
        id: 'msg1',
        userId: userId,
        content: 'Benvenuto su MyZubster! 🌱',
        timestamp: new Date().toISOString(),
        type: 'welcome',
        read: false
      }
    ];
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyZubster backend running on port ${PORT}`);
});
