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

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
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

// Routes
app.use('/api/gardens', gardenRoutes);
app.use('/api/photos', photoRoutes);

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
        description: 'AI orchestration service',
        endpoint: 'http://localhost:3001'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Garden service running on port ${PORT}`);
});

module.exports = app;
