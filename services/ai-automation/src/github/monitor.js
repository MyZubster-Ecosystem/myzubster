const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const EventEmitter = require('events');

class GitHubMonitor extends EventEmitter {
    constructor(token, logger) {
        super();
        this.token = token;
        this.logger = logger;
        this.octokit = null;
        this.running = false;
        this.issues = {};
        this.repo = process.env.GITHUB_REPO || 'MyZubster-Ecosystem/MyZubsterGateway';
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3002';
        this.checkInterval = null;
    }
    
    async start() {
        if (!this.token || this.token === 'your_github_token') {
            this.logger.warn('GitHub token not configured. Running in mock mode.');
            this.running = true;
            
            setTimeout(() => {
                this.emit('newIssue', {
                    number: 1,
                    title: 'Test Issue - GitHub Monitor is working',
                    body: 'This is a test issue to verify the GitHub monitor integration.',
                    html_url: 'https://github.com/test/repo/issues/1',
                    labels: [{ name: 'bounty' }, { name: 'enhancement' }],
                    created_at: new Date().toISOString()
                });
            }, 5000);
            
            return;
        }
        
        try {
            this.octokit = new Octokit({
                auth: this.token,
                userAgent: 'MyZubster-AI-Automation'
            });
            
            await this.octokit.rest.users.getAuthenticated();
            
            this.running = true;
            this.logger.info('GitHub monitor is ready');
            
            await this.checkNewIssues();
            this.startPeriodicCheck();
        } catch (error) {
            this.logger.error('Failed to start GitHub monitor:', error);
            throw error;
        }
    }
    
    startPeriodicCheck() {
        this.checkInterval = setInterval(() => {
            this.checkNewIssues().catch(error => {
                this.logger.error('Periodic check failed:', error);
            });
        }, 300000);
    }
    
    async stop() {
        this.running = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    isRunning() {
        return this.running;
    }
    
    async checkNewIssues() {
        if (!this.running) {
            this.logger.warn('GitHub monitor not running');
            return;
        }
        
        try {
            const [owner, repo] = this.repo.split('/');
            
            const response = await this.octokit.rest.issues.listForRepo({
                owner,
                repo,
                state: 'open',
                sort: 'updated',
                direction: 'desc',
                per_page: 10
            });
            
            const newIssues = [];
            for (const issue of response.data) {
                const key = `${issue.number}`;
                if (!this.issues[key]) {
                    this.issues[key] = {
                        ...issue,
                        firstSeen: new Date()
                    };
                    newIssues.push(issue);
                    
                    this.emit('newIssue', issue);
                    await this.notifyNewIssue(issue);
                }
            }
            
            if (newIssues.length > 0) {
                this.logger.info(`Found ${newIssues.length} new issues`);
                await this.analyzeNewIssues(newIssues);
            }
            
            return response.data;
        } catch (error) {
            this.logger.error('Error checking GitHub issues:', error);
            throw error;
        }
    }
    
    async notifyNewIssue(issue) {
        try {
            await axios.post(`${this.backendUrl}/api/notifications/github`, {
                type: 'new_issue',
                title: issue.title,
                number: issue.number,
                url: issue.html_url,
                body: issue.body ? issue.body.substring(0, 500) : '',
                created_at: issue.created_at
            }).catch(() => {
                this.logger.debug('Backend notification skipped (mock mode)');
            });
            this.logger.info(`Notified about new issue #${issue.number}`);
        } catch (error) {
            this.logger.error('Error notifying about new issue:', error);
        }
    }
    
    async analyzeNewIssues(issues) {
        try {
            this.emit('analyzeIssues', issues);
        } catch (error) {
            this.logger.error('Error analyzing issues with AI:', error);
        }
    }
    
    async getIssueDetails(issueNumber) {
        try {
            const [owner, repo] = this.repo.split('/');
            
            const response = await this.octokit.rest.issues.get({
                owner,
                repo,
                issue_number: issueNumber
            });
            
            return response.data;
        } catch (error) {
            this.logger.error(`Error getting issue #${issueNumber}:`, error);
            throw error;
        }
    }
    
    async commentOnIssue(issueNumber, comment) {
        try {
            const [owner, repo] = this.repo.split('/');
            
            const response = await this.octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body: comment
            });
            
            this.logger.info(`Commented on issue #${issueNumber}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error commenting on issue #${issueNumber}:`, error);
            throw error;
        }
    }
}

module.exports = GitHubMonitor;
