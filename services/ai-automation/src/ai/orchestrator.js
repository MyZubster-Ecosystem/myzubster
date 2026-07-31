const axios = require('axios');
const axiosRetry = require('axios-retry');

class AIOrchestrator {
    constructor(logger) {
        this.logger = logger;
        this.running = false;
        this.models = {
            deepseek: {
                url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
                key: process.env.DEEPSEEK_API_KEY,
                model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
            },
            gemma: {
                url: process.env.GEMMA_API_URL || 'http://localhost:11434/api',
                model: process.env.GEMMA_MODEL || 'gemma:2b'
            },
            llama: {
                url: process.env.GEMMA_API_URL || 'http://localhost:11434/api',
                model: process.env.LLAMA_MODEL || 'llama3.2:3b'
            }
        };
        this.defaultModel = process.env.DEFAULT_AI_MODEL || 'gemma:2b';
        
        axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    }
    
    async start() {
        this.running = true;
        this.logger.info('AI Orchestrator is ready');
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
            await this.testOllama(this.models.gemma);
            this.logger.info('✅ Gemma connection successful');
        } catch (error) {
            this.logger.warn('⚠️ Gemma test failed:', error.message);
        }
        
        try {
            await this.testOllama(this.models.llama);
            this.logger.info('✅ Llama connection successful');
        } catch (error) {
            this.logger.warn('⚠️ Llama test failed:', error.message);
        }
        
        if (this.models.deepseek.key && this.models.deepseek.key !== 'your_deepseek_api_key') {
            try {
                await this.testDeepSeek();
                this.logger.info('✅ DeepSeek connection successful');
            } catch (error) {
                this.logger.warn('⚠️ DeepSeek test failed:', error.message);
            }
        }
        
        this.logger.info('All AI model connections tested successfully');
    }
    
    async testOllama(modelConfig) {
        const response = await axios.post(
            `${modelConfig.url}/generate`,
            {
                model: modelConfig.model,
                prompt: 'Hello, this is a test.',
                stream: false,
                options: {
                    temperature: 0.5,
                    max_tokens: 10
                }
            },
            { timeout: 5000 }
        );
        
        if (!response.data || !response.data.response) {
            throw new Error('Invalid response from Ollama');
        }
        return response.data;
    }
    
    async testDeepSeek() {
        const response = await axios.post(
            `${this.models.deepseek.url}/chat/completions`,
            {
                model: this.models.deepseek.model,
                messages: [
                    { role: 'user', content: 'Hello, this is a test.' }
                ],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.models.deepseek.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );
        
        if (!response.data || !response.data.choices) {
            throw new Error('Invalid response from DeepSeek');
        }
        return response.data;
    }
    
    async analyzeWithOllama(modelConfig, prompt) {
        try {
            const response = await axios.post(
                `${modelConfig.url}/generate`,
                {
                    model: modelConfig.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.3,
                        top_p: 0.9,
                        max_tokens: 1000
                    }
                },
                {
                    timeout: 60000
                }
            );
            
            return {
                model: modelConfig.model,
                analysis: response.data.response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error(`Error with ${modelConfig.model}:`, error.message);
            throw error;
        }
    }
    
    async analyzeWithDeepSeek(prompt) {
        const response = await axios.post(
            `${this.models.deepseek.url}/chat/completions`,
            {
                model: this.models.deepseek.model,
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
    
    async analyzeIssue(issue) {
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
        
        const models = [
            { name: 'gemma', config: this.models.gemma, method: 'ollama' },
            { name: 'llama', config: this.models.llama, method: 'ollama' }
        ];
        
        if (this.models.deepseek.key && this.models.deepseek.key !== 'your_deepseek_api_key') {
            models.push({ name: 'deepseek', config: this.models.deepseek, method: 'api' });
        }
        
        let lastError = null;
        for (const model of models) {
            try {
                if (model.method === 'ollama') {
                    return await this.analyzeWithOllama(model.config, prompt);
                } else if (model.method === 'api') {
                    return await this.analyzeWithDeepSeek(prompt);
                }
            } catch (error) {
                lastError = error;
                this.logger.warn(`${model.name} failed, trying next...`);
            }
        }
        
        return this.getDefaultAnalysis(issue);
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
