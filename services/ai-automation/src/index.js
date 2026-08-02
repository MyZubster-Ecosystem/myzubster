// ============================================================
// MyZubster AI Automation Service
// Express-based service with MongoDB, GitHub integration,
// Telegram bot, and scheduled cron jobs
// ============================================================

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const winston = require('winston');
const { Octokit } = require('@octokit/rest');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster';

// ── Logger setup ──────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.error('MongoDB connection error:', err.message));

// ── GitHub Integration ────────────────────────────────────
let octokit = null;
if (process.env.GITHUB_TOKEN) {
  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  logger.info('GitHub API initialized');
}

// ── Telegram Bot ──────────────────────────────────────────
let bot = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  logger.info('Telegram bot initialized');
}

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'myzubster-ai-automation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    github: octokit ? 'configured' : 'not configured',
    telegram: bot ? 'configured' : 'not configured'
  });
});

// ── API Routes ────────────────────────────────────────────
app.get('/api/status', (_req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cronJobs: cron ? 'active' : 'inactive'
  });
});

// ── Cron Jobs ─────────────────────────────────────────────
// Example: Run every hour to check for new GitHub issues
cron.schedule('0 * * * *', () => {
  logger.info('Running hourly scheduled task');
  // TODO: Add automated task logic here
});

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`MyZubster AI Automation service running on port ${PORT}`);
});

module.exports = app;