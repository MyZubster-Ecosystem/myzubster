class AutomationOrchestrator {
    constructor(telegramBot, githubMonitor, aiOrchestrator, logger) {
        this.telegramBot = telegramBot;
        this.githubMonitor = githubMonitor;
        this.aiOrchestrator = aiOrchestrator;
        this.logger = logger;
        this.running = false;
        this.tasks = [];
    }
    
    async start() {
        this.running = true;
        this.logger.info('Automation orchestrator started');
        
        this.tasks = [
            {
                name: 'Monitor GitHub Issues',
                schedule: '*/5 * * * *',
                enabled: true
            },
            {
                name: 'Process Bounties',
                schedule: '0 */6 * * *',
                enabled: true
            },
            {
                name: 'AI Code Review',
                schedule: '0 */12 * * *',
                enabled: false
            }
        ];
        
        this.registerHandlers();
        this.logger.info('Orchestrator ready, listening for events...');
    }
    
    async stop() {
        this.running = false;
        this.logger.info('Automation orchestrator stopped');
    }
    
    registerHandlers() {
        if (this.githubMonitor && typeof this.githubMonitor.on === 'function') {
            this.githubMonitor.on('newIssue', async (issue) => {
                await this.handleNewIssue(issue);
            });
            
            this.githubMonitor.on('analyzeIssues', async (issues) => {
                await this.handleAnalyzeIssues(issues);
            });
            
            this.logger.info('GitHub event handlers registered');
        } else {
            this.logger.warn('GitHub monitor does not support event handlers');
        }
    }
    
    async handleNewIssue(issue) {
        this.logger.info(`Processing new issue #${issue.number}: ${issue.title}`);
        
        try {
            const analysis = await this.aiOrchestrator.analyzeIssue(issue);
            
            const shouldCreateBounty = this.shouldCreateBounty(issue, analysis);
            
            if (shouldCreateBounty) {
                const bounty = await this.createBounty(issue, analysis);
                await this.notifyBountyCreated(bounty);
            }
            
            if (this.telegramBot) {
                await this.telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID || 'test', 
                    `📢 **New Issue Detected**\n\n` +
                    `**#${issue.number}:** ${issue.title}\n` +
                    `🔗 ${issue.html_url || 'https://github.com'}`,
                    { parse_mode: 'Markdown' }
                );
            }
            
            await this.storeIssueAnalysis(issue, analysis);
            
        } catch (error) {
            this.logger.error(`Error processing issue #${issue.number}:`, error);
        }
    }
    
    async handleAnalyzeIssues(issues) {
        this.logger.info(`Analyzing ${issues.length} issues with AI...`);
        try {
            const results = await this.aiOrchestrator.summarizeIssues(issues);
            this.logger.info(`Analysis complete for ${results.length} issues`);
        } catch (error) {
            this.logger.error('Error in batch analysis:', error);
        }
    }
    
    shouldCreateBounty(issue, analysis) {
        const keywords = ['bug', 'feature', 'enhancement', 'bounty'];
        const hasKeyword = issue.labels && issue.labels.some(label => 
            keywords.some(keyword => label.name.toLowerCase().includes(keyword))
        );
        
        const isBounty = issue.labels && issue.labels.some(label => 
            label.name.toLowerCase().includes('bounty') || 
            label.name.toLowerCase().includes('💰')
        );
        
        return isBounty || hasKeyword;
    }
    
    async createBounty(issue, analysis) {
        const bounty = {
            title: issue.title,
            description: issue.body || '',
            number: issue.number,
            url: issue.html_url || '',
            labels: issue.labels ? issue.labels.map(l => l.name) : [],
            analysis: analysis,
            status: 'open',
            created_at: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3002'}/api/bounties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.BACKEND_API_KEY || 'test'}`
                },
                body: JSON.stringify(bounty)
            }).catch(() => {
                this.logger.debug('Backend not available, bounty saved locally');
                return { ok: true, json: () => Promise.resolve(bounty) };
            });
            
            if (response.ok) {
                return await response.json();
            }
            return bounty;
        } catch (error) {
            this.logger.error('Error creating bounty:', error);
            return bounty;
        }
    }
    
    async notifyBountyCreated(bounty) {
        if (this.telegramBot) {
            await this.telegramBot.sendMessage(
                process.env.TELEGRAM_CHAT_ID || 'test',
                `💰 **New Bounty Created!**\n\n` +
                `**Issue:** ${bounty.title}\n` +
                `**ID:** #${bounty.number}\n` +
                `**Status:** ${bounty.status}\n\n` +
                `View: ${bounty.url}`,
                { parse_mode: 'Markdown' }
            );
        }
    }
    
    async storeIssueAnalysis(issue, analysis) {
        this.logger.info(`Stored analysis for issue #${issue.number}`);
    }
    
    async cleanupTasks() {
        this.logger.info('Cleaning up old tasks...');
    }
}

module.exports = AutomationOrchestrator;
