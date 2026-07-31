#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const cron = require('node-cron');

// Import modules
const TelegramBot = require('./src/telegram/bot');
const GitHubMonitor = require('./src/github/monitor');
const AIOrchestrator = require('./src/ai/orchestrator');
const AutomationOrchestrator = require('./src/orchestrator/index');

// Setup logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Initialize components
const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, logger);
const githubMonitor = new GitHubMonitor(process.env.GITHUB_TOKEN, logger);
const aiOrchestrator = new AIOrchestrator(logger);
const automation = new AutomationOrchestrator(
    telegramBot,
    githubMonitor,
    aiOrchestrator,
    logger
);

// Express app for health checks
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            telegram: telegramBot.isRunning(),
            github: githubMonitor.isRunning(),
            ai: aiOrchestrator.isRunning()
        }
    });
});

// Start all services
async function startServices() {
    try {
        logger.info('Starting MyZubster AI Automation System...');
        
        // Start Telegram bot
        await telegramBot.start();
        logger.info('✅ Telegram bot started');
        
        // Start GitHub monitor
        await githubMonitor.start();
        logger.info('✅ GitHub monitor started');
        
        // Start AI orchestrator
        await aiOrchestrator.start();
        logger.info('✅ AI orchestrator started');
        
        // Start automation orchestrator
        await automation.start();
        logger.info('✅ Automation orchestrator started');
        
        // Schedule periodic tasks
        scheduleTasks();
        
        // Start Express server
        const PORT = process.env.PORT || 5678;
        app.listen(PORT, () => {
            logger.info(`✅ AI Automation API running on port ${PORT}`);
        });
        
        logger.info('🎉 All services started successfully!');
    } catch (error) {
        logger.error('Failed to start services:', error);
        process.exit(1);
    }
}

// Schedule periodic tasks
function scheduleTasks() {
    // Check GitHub issues every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        logger.info('Running scheduled GitHub check...');
        try {
            await githubMonitor.checkNewIssues();
        } catch (error) {
            logger.error('Error in scheduled GitHub check:', error);
        }
    });
    
    // Clean up pending tasks every hour
    cron.schedule('0 * * * *', async () => {
        logger.info('Running scheduled cleanup...');
        try {
            await automation.cleanupTasks();
        } catch (error) {
            logger.error('Error in cleanup task:', error);
        }
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await automation.stop();
    await telegramBot.stop();
    await githubMonitor.stop();
    await aiOrchestrator.stop();
    process.exit(0);
});

// Start the system
startServices();
