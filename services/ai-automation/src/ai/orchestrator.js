const axios = require('axios');
const axiosRetry = require('axios-retry');

/**
 * Expected JSON schema for issue analysis output.
 * Used to instruct the LLM and to validate/parse responses.
 */
const ISSUE_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Brief 1-2 sentence summary of the issue' },
    complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Implementation complexity' },
    priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Business/technical priority' },
    sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'], description: 'Sentiment of the issue text' },
    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'How urgently this should be addressed' },
    skillsRequired: { type: 'array', items: { type: 'string' }, description: 'Technical skills needed (e.g. JavaScript, React, MongoDB)' },
    dependencies: { type: 'array', items: { type: 'string' }, description: 'Prerequisites or blocking issues' },
    relatedAreas: { type: 'array', items: { type: 'string' }, description: 'Codebase areas affected' },
    estimatedEffort: { type: 'string', description: 'Estimated effort (e.g. "4-8 hours", "1-2 days")' },
    recommendedApproach: { type: 'string', description: 'Step-by-step recommended implementation approach' },
    potentialRisks: { type: 'array', items: { type: 'string' }, description: 'Potential risks and mitigations' },
    suggestedBounty: { type: 'string', description: 'Suggested bounty amount (e.g. "0.5 XMR", "$200")' }
  },
  required: ['summary', 'complexity', 'priority', 'sentiment', 'urgency']
};

const FEW_SHOT_EXAMPLES = `
Example 1:
Input: {
  "title": "Fix: Monero payment gateway timeout",
  "body": "When users try to pay with Monero, the transaction times out after 30 seconds. Need to increase timeout and add better error handling.",
  "labels": ["bug", "bounty", "high-priority"]
}
Output: {
  "summary": "Monero payments time out after 30s; need to increase the timeout and improve error handling.",
  "complexity": "medium",
  "priority": "high",
  "sentiment": "negative",
  "urgency": "high",
  "skillsRequired": ["Node.js", "Monero RPC", "Express"],
  "dependencies": ["Updated Monero daemon configuration", "Frontend retry UX"],
  "relatedAreas": ["gateway", "payment-service", "frontend-checkout"],
  "estimatedEffort": "4-8 hours",
  "recommendedApproach": "1) Reproduce timeout in dev; 2) Increase gateway timeout and add retries; 3) Show user-friendly error; 4) Add integration test.",
  "potentialRisks": ["Longer timeout may hide real failures", "Retry logic may create duplicate transactions"],
  "suggestedBounty": "0.5 XMR"
}

Example 2:
Input: {
  "title": "Add support for Slack notifications",
  "body": "Integrate Slack as an alternative notification channel to Telegram.",
  "labels": ["feature", "enhancement", "integration"]
}
Output: {
  "summary": "Add Slack notifications as an alternative to Telegram for system alerts.",
  "complexity": "medium",
  "priority": "low",
  "sentiment": "positive",
  "urgency": "low",
  "skillsRequired": ["Node.js", "Slack Web API", "Express"],
  "dependencies": ["Slack app credentials", "Environment config for webhook URL"],
  "relatedAreas": ["telegram-bot", "notification-service"],
  "estimatedEffort": "1-2 days",
  "recommendedApproach": "1) Create Slack app and get webhook; 2) Build notifier module; 3) Add env vars; 4) Test delivery and fallback.",
  "potentialRisks": ["Rate limits on Slack API", "Duplicate notifications if both Telegram and Slack are enabled"],
  "suggestedBounty": "0.3 XMR"
}
`;

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
    
    /**
     * Build an improved prompt with structured output instructions and few-shot examples.
     */
    buildAnalysisPrompt(issue) {
        const title = issue.title || 'Untitled issue';
        const body = (issue.body || '').substring(0, 2000);
        const labels = issue.labels ? issue.labels.map(l => l.name).join(', ') : 'None';

        return `You are an expert technical analyst for the MyZubster open-source ecosystem.
Analyze the following GitHub issue and return ONLY a valid JSON object matching this schema:

${JSON.stringify(ISSUE_ANALYSIS_SCHEMA, null, 2)}

${FEW_SHOT_EXAMPLES}

Now analyze this issue:
Title: ${title}
Description: ${body || 'No description provided'}
Labels: ${labels}

Return ONLY the JSON object. Do not include markdown fences, explanations, or extra text.`;
    }
    
    /**
     * Parse the LLM response, attempting to extract JSON.
     * Falls back to returning the raw text in the `analysis` field.
     */
    parseAnalysisResponse(rawText, issue) {
        let structured = null;
        
        // Try to extract JSON from markdown fences or surrounding text
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const candidate = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
        
        try {
            structured = JSON.parse(candidate);
            
            // Validate required fields and normalize
            if (typeof structured.summary !== 'string') structured.summary = issue.title || '';
            if (!['low','medium','high'].includes(structured.complexity)) structured.complexity = 'medium';
            if (!['low','medium','high'].includes(structured.priority)) structured.priority = 'medium';
            if (!['positive','neutral','negative'].includes(structured.sentiment)) structured.sentiment = 'neutral';
            if (!['low','medium','high','critical'].includes(structured.urgency)) structured.urgency = 'medium';
            if (!Array.isArray(structured.skillsRequired)) structured.skillsRequired = [];
            if (!Array.isArray(structured.dependencies)) structured.dependencies = [];
            if (!Array.isArray(structured.relatedAreas)) structured.relatedAreas = [];
            if (typeof structured.estimatedEffort !== 'string') structured.estimatedEffort = '4-8 hours';
            if (typeof structured.recommendedApproach !== 'string') structured.recommendedApproach = '';
            if (!Array.isArray(structured.potentialRisks)) structured.potentialRisks = [];
            if (typeof structured.suggestedBounty !== 'string') structured.suggestedBounty = '';
        } catch (error) {
            this.logger.warn('Failed to parse structured analysis JSON:', error.message);
            structured = null;
        }
        
        return structured;
    }
    
    async analyzeIssue(issue) {
        try {
            const prompt = this.buildAnalysisPrompt(issue);
            
            // Try DeepSeek first
            if (this.models.deepseek.key && this.models.deepseek.key !== 'your_deepseek_api_key') {
                try {
                    return await this.analyzeWithDeepSeek(prompt, issue);
                } catch (error) {
                    this.logger.warn('DeepSeek analysis failed, falling back to Gemma:', error.message);
                }
            }
            
            // Fallback to Gemma
            return await this.analyzeWithGemma(prompt, issue);
        } catch (error) {
            this.logger.error('Error analyzing issue with AI:', error);
            return this.getDefaultAnalysis(issue);
        }
    }
    
    async analyzeWithDeepSeek(prompt, issue) {
        const response = await axios.post(
            `${this.models.deepseek.url}/chat/completions`,
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are an expert technical analyst. Always respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.3,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.models.deepseek.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        const rawText = response.data.choices[0].message.content;
        const structured = this.parseAnalysisResponse(rawText, issue);
        
        return {
            model: 'deepseek',
            analysis: structured ? this.renderStructuredAnalysis(structured) : rawText,
            structured,
            timestamp: new Date().toISOString()
        };
    }
    
    async analyzeWithGemma(prompt, issue) {
        try {
            const response = await axios.post(
                `${this.models.gemma.url}/generate`,
                {
                    model: 'gemma:2b',
                    prompt: prompt,
                    stream: false,
                    format: 'json',
                    options: {
                        temperature: 0.3,
                        top_p: 0.9,
                        max_tokens: 800
                    }
                },
                {
                    timeout: 60000
                }
            );
            
            const rawText = response.data.response;
            const structured = this.parseAnalysisResponse(rawText, issue);
            
            return {
                model: 'gemma',
                analysis: structured ? this.renderStructuredAnalysis(structured) : rawText,
                structured,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Gemma analysis failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Convert structured analysis into a human-readable markdown string.
     * Preserved for backward compatibility with consumers that read `analysis`.
     */
    renderStructuredAnalysis(data) {
        const lines = [
            `📋 **Issue Analysis**`,
            ``,
            `**Summary:** ${data.summary}`,
            `**Complexity:** ${data.complexity}`,
            `**Priority:** ${data.priority}`,
            `**Sentiment:** ${data.sentiment}`,
            `**Urgency:** ${data.urgency}`,
            `**Estimated Effort:** ${data.estimatedEffort}`,
            ``,
            `**Recommended Approach:**`,
            ...(data.recommendedApproach || '').split('\n').map(l => l ? `- ${l}` : ''),
            ``,
            `**Skills Required:** ${(data.skillsRequired || []).join(', ') || 'N/A'}`,
            `**Dependencies:** ${(data.dependencies || []).join(', ') || 'N/A'}`,
            `**Related Areas:** ${(data.relatedAreas || []).join(', ') || 'N/A'}`,
            ``,
            `**Potential Risks:**`,
            ...(data.potentialRisks || []).map(r => `- ${r}`),
            ``,
            `**Suggested Bounty:** ${data.suggestedBounty || 'N/A'}`
        ].filter(Boolean);
        
        return lines.join('\n');
    }
    
    getDefaultAnalysis(issue) {
        const fallback = {
            summary: issue.title || 'Untitled issue',
            complexity: 'medium',
            priority: 'medium',
            sentiment: 'neutral',
            urgency: 'medium',
            skillsRequired: [],
            dependencies: [],
            relatedAreas: [],
            estimatedEffort: '4-8 hours',
            recommendedApproach: 'Review the issue description, check for similar issues, assess impact, and plan implementation.',
            potentialRisks: ['May affect existing functionality', 'Need thorough testing', 'Consider edge cases'],
            suggestedBounty: ''
        };
        
        return {
            model: 'fallback',
            analysis: this.renderStructuredAnalysis(fallback),
            structured: fallback,
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

**Bounty Amount:** ${analysis.structured?.suggestedBounty || 'To be determined'}
**Difficulty:** ${analysis.structured?.complexity || 'Medium'}
**Skills Required:** ${analysis.structured?.skillsRequired?.join(', ') || 'JavaScript, Node.js, MongoDB, React'}
**Deadline:** 2 weeks
        `;
    }
}

module.exports = AIOrchestrator;
