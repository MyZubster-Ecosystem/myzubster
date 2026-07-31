const TelegramBot = require('node-telegram-bot-api');

class TelegramBotHandler {
    constructor(token, logger) {
        this.token = token;
        this.logger = logger;
        this.bot = null;
        this.running = false;
        this.commands = {
            '/start': this.handleStart.bind(this),
            '/status': this.handleStatus.bind(this),
            '/bounties': this.handleBounties.bind(this),
            '/github': this.handleGitHub.bind(this),
            '/analyze': this.handleAnalyze.bind(this),
            '/help': this.handleHelp.bind(this)
        };
    }
    
    async start() {
        if (!this.token || this.token === 'your_telegram_bot_token') {
            this.logger.warn('Telegram bot token not configured. Running in mock mode.');
            this.running = true;
            return;
        }
        
        try {
            this.bot = new TelegramBot(this.token, { polling: true });
            
            // Register command handlers
            Object.keys(this.commands).forEach(cmd => {
                this.bot.onText(new RegExp(`^${cmd}`), (msg, match) => {
                    this.commands[cmd](msg, match);
                });
            });
            
            // Handle inline queries
            this.bot.on('callback_query', this.handleCallback.bind(this));
            
            this.running = true;
            this.logger.info('Telegram bot is ready');
        } catch (error) {
            this.logger.error('Failed to start Telegram bot:', error);
            throw error;
        }
    }
    
    async stop() {
        if (this.bot) {
            this.bot.stopPolling();
            this.running = false;
        }
    }
    
    isRunning() {
        return this.running;
    }
    
    // Command Handlers
    async handleStart(msg) {
        const chatId = msg.chat.id;
        const text = `
🤖 **MyZubster AI Automation Bot**

Welcome! I can help you manage your MyZubster ecosystem.

**Available Commands:**
/status - Check system status
/bounties - View active bounties
/github - Check GitHub activity
/analyze - AI analysis of issues
/help - Show this help message

I'll notify you about:
• New GitHub issues and PRs
• Bounty status updates
• AI-generated insights
• System health alerts
        `;
        this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    
    async handleStatus(msg) {
        const chatId = msg.chat.id;
        const status = `
📊 **System Status**

🟢 Telegram Bot: Running
🟢 GitHub Monitor: Running
🟢 AI Orchestrator: Running
🟢 Backend API: Checking...

Last Check: ${new Date().toISOString()}
        `;
        this.sendMessage(chatId, status, { parse_mode: 'Markdown' });
    }
    
    async handleBounties(msg) {
        const chatId = msg.chat.id;
        // Fetch bounties from backend
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/bounties`);
            const bounties = await response.json();
            
            if (bounties.length === 0) {
                this.sendMessage(chatId, 'No active bounties at the moment.');
                return;
            }
            
            let text = '💰 **Active Bounties**\n\n';
            bounties.forEach((bounty, index) => {
                text += `${index + 1}. **${bounty.title}**\n`;
                text += `   💰 ${bounty.amount} ${bounty.currency}\n`;
                text += `   📝 ${bounty.description.substring(0, 100)}...\n\n`;
            });
            
            this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error fetching bounties:', error);
            this.sendMessage(chatId, '❌ Failed to fetch bounties');
        }
    }
    
    async handleGitHub(msg) {
        const chatId = msg.chat.id;
        // Check GitHub activity
        try {
            const issues = await this.getRecentIssues();
            let text = '🐙 **Recent GitHub Activity**\n\n';
            
            issues.slice(0, 5).forEach(issue => {
                text += `• ${issue.title}\n`;
                text += `  #${issue.number} | ${issue.state}\n`;
                text += `  ${issue.html_url}\n\n`;
            });
            
            this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error fetching GitHub issues:', error);
            this.sendMessage(chatId, '❌ Failed to fetch GitHub activity');
        }
    }
    
    async handleAnalyze(msg) {
        const chatId = msg.chat.id;
        this.sendMessage(chatId, '🔍 Analyzing GitHub issues with AI...');
        
        try {
            const analysis = await this.analyzeIssues();
            this.sendMessage(chatId, analysis, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error in AI analysis:', error);
            this.sendMessage(chatId, '❌ Failed to analyze issues');
        }
    }
    
    async handleHelp(msg) {
        this.handleStart(msg);
    }
    
    async handleCallback(query) {
        const data = query.data;
        // Handle inline button clicks
        this.logger.info('Callback query:', data);
    }
    
    // Helper Methods
    async sendMessage(chatId, text, options = {}) {
        if (this.bot) {
            try {
                await this.bot.sendMessage(chatId, text, options);
            } catch (error) {
                this.logger.error('Error sending message:', error);
            }
        } else {
            this.logger.info(`[MOCK] Sending to ${chatId}: ${text.substring(0, 100)}...`);
        }
    }
    
    async getRecentIssues() {
        // Implementation for fetching GitHub issues
        return [];
    }
    
    async analyzeIssues() {
        // Implementation for AI analysis
        return '📊 **AI Analysis Results**\n\nAI analysis of GitHub issues is in progress...';
    }
}

module.exports = TelegramBotHandler;
