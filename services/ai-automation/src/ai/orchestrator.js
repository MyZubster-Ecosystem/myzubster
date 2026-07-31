const axios = require('axios');
const axiosRetry = require('axios-retry');

class AIOrchestrator {
    constructor(logger) {
        this.logger = logger;
        this.running = false;
        this.models = {
            deepseek: {
                url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
                key: process.env.DEEPSEEK_API_KEY
            },
            gemma: {
                url: process.env.GEMMA_API_URL || 'http://localhost:11434/api'
            }
        };
        
        // Configure axios retry
        axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    }
    
    async start() {
        this.running = true;
        this.logger.info('AI Orchestrator is ready');
        
        // Test connections
        await this.testConnections();
    }
    
    async stop() {
        this.running = false;
    }
    
    isRunning() {
        return this.running;
    }
    
    async testConnections() {
        try {
            // Test DeepSeek
            if (this.models.deepseek.key && this.models.deepseek.key !== 'your_deepseek_api_key') {
                await this.testDeepSeek();
            }
            
            // Test Gemma
            await this.testGemma();
            
            this.logger.info('All AI model connections tested successfully');
        } catch (error) {
            this.logger.warn('Some AI model connections failed:', error.message);
        }
    }
    
    async testDeepSeek() {
        try {
            const response = await axios.post(
                `${this.models.deepseek.url}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'user', content: 'Hello, this is a test.' }
                    ],
                    max_tokens: 10
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.models.deepseek.key}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                this.logger.info('DeepSeek connection successful');
            }
        } catch (error) {
            this.logger.error('DeepSeek test failed:', error.message);
            throw error;
        }
    }
    
    async testGemma() {
        try {
            const response = await axios.post(
                `${this.models.gemma.url}/generate`,
                {
                    model: 'gemma:2b',
                    prompt: 'Hello, this is a test.',
                    stream: false
                }
            );
            
            if (response.data) {
                this.logger.info('Gemma connection successful');
            }
        } catch (error) {
            this.logger.warn('Gemma test failed:', error.message);
            // Gemma might not be running, but we don't throw
        }
    }
    
    async analyzeIssue(issue) {
        try {
            const prompt = `
Analyze this GitHub issue and provide insights:

Title: ${issue.title}
Description: ${issue.body ? issue.body.substring(0, 1000) : 'No description provided'}
Labels: ${issue.labels ? issue.labels.map(l => l.name).join(', ') : 'None'}

Provide:
1. Summary (1-2 sentences)
2. Complexity (Low/Medium/High)
3. Priority (Low/Medium/High)
4. Recommended approach
5. Estimated effort (hours)
6. Related areas in the codebase
7. Potential risks
            `;
            
            // Try DeepSeek first
            if (this.models.deepseek.key && this.models.deepseek.key !== 'your_deepseek_api_key') {
                try {
                    return await this.analyzeWithDeepSeek(prompt);
                } catch (error) {
                    this.logger.warn('DeepSeek analysis failed, falling back to Gemma:', error.message);
                }
            }
            
            // Fallback to Gemma
            return await this.analyzeWithGemma(prompt);
        } catch (error) {
            this.logger.error('Error analyzing issue with AI:', error);
            return this.getDefaultAnalysis(issue);
        }
    }
    
    async analyzeWithDeepSeek(prompt) {
        const response = await axios.post(
            `${this.models.deepseek.url}/chat/completions`,
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant for MyZubster, analyzing GitHub issues and providing actionable insights.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.models.deepseek.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        return {
            model: 'deepseek',
            analysis: response.data.choices[0].message.content,
            timestamp: new Date().toISOString()
        };
    }
    
    async analyzeWithGemma(prompt) {
        try {
            const response = await axios.post(
                `${this.models.gemma.url}/generate`,
                {
                    model: 'gemma:2b',
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.3,
                        top_p: 0.9,
                        max_tokens: 500
                    }
                },
                {
                    timeout: 60000
                }
            );
            
            return {
                model: 'gemma',
                analysis: response.data.response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Gemma analysis failed:', error.message);
            throw error;
        }
    }
    
    getDefaultAnalysis(issue) {
        return {
            model: 'fallback',
            analysis: `
📋 **Issue Analysis**

**Summary:** ${issue.title}

**Complexity:** Medium
**Priority:** Medium
**Estimated Effort:** 4-8 hours

**Recommended Approach:**
1. Review the issue description
2. Check for similar issues
3. Assess the impact on the system
4. Plan implementation

**Potential Risks:**
- May affect existing functionality
- Need thorough testing
- Consider edge cases
            `,
            timestamp: new Date().toISOString()
        };
    }
    
    async summarizeIssues(issues) {
        // Batch analyze multiple issues
        const results = [];
        for (const issue of issues) {
            const analysis = await this.analyzeIssue(issue);
            results.push({
                number: issue.number,
                ...analysis
            });
        }
        return results;
    }
    
    async generateBountyDescription(issue) {
        const analysis = await this.analyzeIssue(issue);
        // Parse analysis to generate bounty description
        return `
**Bounty: ${issue.title}**

${analysis.analysis}

**Bounty Amount:** To be determined
**Difficulty:** Medium
**Skills Required:** JavaScript, Node.js, MongoDB, React
**Deadline:** 2 weeks
        `;
    }
}

module.exports = AIOrchestrator;
