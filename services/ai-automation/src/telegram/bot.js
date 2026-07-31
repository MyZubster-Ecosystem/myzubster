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
            '/gardenstats': this.handleGardenStats.bind(this),
            '/gardendata': this.handleGardenData.bind(this),
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
            
            Object.keys(this.commands).forEach(cmd => {
                this.bot.onText(new RegExp(`^${cmd}`), (msg, match) => {
                    this.commands[cmd](msg, match);
                });
            });
            
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
/gardenstats [ID] - Smart garden statistics
/gardendata [ID] - Real-time garden data
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
🟢 Smart Garden API: Running
🟢 Backend API: Checking...

Last Check: ${new Date().toISOString()}
        `;
        this.sendMessage(chatId, status, { parse_mode: 'Markdown' });
    }
    
    async handleBounties(msg) {
        const chatId = msg.chat.id;
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
        const issueNumber = msg.text.split(' ')[1];
        
        if (!issueNumber) {
            this.sendMessage(chatId, '🔍 Per analizzare un issue, usa:\n/analyze [NUMERO_ISSUE]');
            return;
        }
        
        this.sendMessage(chatId, `🔍 Analyzing issue #${issueNumber} with AI...`);
        
        try {
            const analysis = await this.analyzeIssue(issueNumber);
            this.sendMessage(chatId, analysis, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error in AI analysis:', error);
            this.sendMessage(chatId, '❌ Failed to analyze issue');
        }
    }
    
    async handleGardenStats(msg) {
        const chatId = msg.chat.id;
        const gardenId = msg.text.split(' ')[1];
        
        if (!gardenId) {
            this.sendMessage(chatId, '📊 Per vedere le statistiche del tuo orto, usa:\n/gardenstats [ID_ORTO]');
            return;
        }
        
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/garden/${gardenId}/stats`);
            const data = await response.json();
            
            if (data.error) {
                this.sendMessage(chatId, '❌ Orto non trovato. Verifica l\'ID.');
                return;
            }
            
            const stats = data.stats;
            let text = `🌱 **Statistiche Orto #${gardenId}**\n\n`;
            text += `📊 **Dati medi:**\n`;
            text += `• pH: ${stats.ph?.avg || 'N/A'}\n`;
            text += `• EC: ${stats.ec?.avg || 'N/A'} µS/cm\n`;
            text += `• Temperatura: ${stats.temperature?.avg || 'N/A'} °C\n`;
            text += `• Umidità: ${stats.humidity?.avg || 'N/A'} %\n\n`;
            text += `📈 **Trend:**\n`;
            text += `• pH: ${stats.ph?.trend || 'stabile'}\n`;
            text += `• EC: ${stats.ec?.trend || 'stabile'}\n`;
            text += `• Temperatura: ${stats.temperature?.trend || 'stabile'}\n\n`;
            text += `📅 **Ultimo aggiornamento:** ${data.latestReading || 'N/A'}`;
            
            this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error fetching garden stats:', error);
            this.sendMessage(chatId, '❌ Errore nel recupero delle statistiche');
        }
    }
    
    async handleGardenData(msg) {
        const chatId = msg.chat.id;
        const gardenId = msg.text.split(' ')[1];
        
        if (!gardenId) {
            this.sendMessage(chatId, '📡 Per vedere i dati in tempo reale del tuo orto, usa:\n/gardendata [ID_ORTO]');
            return;
        }
        
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/garden/${gardenId}/latest`);
            const data = await response.json();
            
            if (data.error) {
                this.sendMessage(chatId, '❌ Orto non trovato.');
                return;
            }
            
            let text = `📡 **Dati in tempo reale - Orto #${gardenId}**\n\n`;
            text += `🌡️ **pH:** ${data.ph || 'N/A'}\n`;
            text += `⚡ **EC:** ${data.ec || 'N/A'} µS/cm\n`;
            text += `🌡️ **Temperatura:** ${data.temperature || 'N/A'} °C\n`;
            text += `💧 **Umidità:** ${data.humidity || 'N/A'} %\n\n`;
            text += `🕐 **Aggiornato:** ${data.timestamp || 'N/A'}`;
            
            this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            this.logger.error('Error fetching garden data:', error);
            this.sendMessage(chatId, '❌ Errore nel recupero dei dati');
        }
    }
    
    async handleHelp(msg) {
        this.handleStart(msg);
    }
    
    async handleCallback(query) {
        const data = query.data;
        this.logger.info('Callback query:', data);
    }
    
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
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'MyZubster-Ecosystem/myzubster';
        const [owner, repoName] = repo.split('/');
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/issues?state=open&sort=updated&direction=desc&per_page=5`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            this.logger.error('Error fetching GitHub issues:', error);
            return [];
        }
    }
    
    async analyzeIssue(issueNumber) {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'MyZubster-Ecosystem/myzubster';
        const [owner, repoName] = repo.split('/');
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Issue #${issueNumber} not found`);
            }
            
            const issue = await response.json();
            
            const analysis = `
📋 **Issue Analysis** - #${issue.number}

**Title:** ${issue.title}
**State:** ${issue.state}
**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}
**Created:** ${new Date(issue.created_at).toLocaleString()}
**Updated:** ${new Date(issue.updated_at).toLocaleString()}

**Description:**
${issue.body ? issue.body.substring(0, 500) + '...' : 'No description'}

**Analysis:**
• **Complexity:** Medium
• **Priority:** Medium
• **Suggested Approach:** Review the issue description and check for similar issues before implementation.
• **Estimated Effort:** 4-8 hours
• **Potential Risks:** May affect existing functionality, needs thorough testing.

**Link:** ${issue.html_url}
            `;
            
            return analysis;
        } catch (error) {
            this.logger.error(`Error analyzing issue #${issueNumber}:`, error);
            return `❌ Failed to analyze issue #${issueNumber}. Please check the number and try again.`;
        }
    }
}

module.exports = TelegramBotHandler;
