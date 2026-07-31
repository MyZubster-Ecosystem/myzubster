/**
 * Tests for AI Orchestrator prompt engineering improvements (#48)
 */

const axios = require('axios');
const AIOrchestrator = require('../../src/ai/orchestrator');

// Mock axios and axios-retry
jest.mock('axios');
jest.mock('axios-retry');

const mockPost = axios.post;

describe('AIOrchestrator - Prompt Engineering (#48)', () => {
  let orchestrator;
  let logger;
  
  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    orchestrator = new AIOrchestrator(logger);
    mockPost.mockClear();
  });
  
  describe('buildAnalysisPrompt', () => {
    test('should include structured JSON schema instructions', () => {
      const issue = {
        title: 'Fix payment timeout',
        body: 'Payments time out after 30s',
        labels: [{ name: 'bug' }]
      };
      
      const prompt = orchestrator.buildAnalysisPrompt(issue);
      
      expect(prompt).toContain('return ONLY a valid JSON object');
      expect(prompt).toContain('"type": "object"');
      expect(prompt).toContain('summary');
      expect(prompt).toContain('sentiment');
      expect(prompt).toContain('urgency');
      expect(prompt).toContain('skillsRequired');
    });
    
    test('should include few-shot examples', () => {
      const issue = {
        title: 'Add Slack notifications',
        body: 'Integrate Slack',
        labels: [{ name: 'feature' }]
      };
      
      const prompt = orchestrator.buildAnalysisPrompt(issue);
      
      expect(prompt).toContain('Example 1');
      expect(prompt).toContain('Example 2');
      expect(prompt).toContain('Output:');
      expect(prompt).toContain('"complexity": "medium"');
    });
    
    test('should include issue details in prompt', () => {
      const issue = {
        title: 'Test issue',
        body: 'Test body',
        labels: [{ name: 'bug' }, { name: 'high-priority' }]
      };
      
      const prompt = orchestrator.buildAnalysisPrompt(issue);
      
      expect(prompt).toContain('Title: Test issue');
      expect(prompt).toContain('Description: Test body');
      expect(prompt).toContain('Labels: bug, high-priority');
    });
    
    test('should truncate long body to 2000 chars', () => {
      const longBody = 'a'.repeat(3000);
      const issue = { title: 'Long', body: longBody, labels: [] };
      
      const prompt = orchestrator.buildAnalysisPrompt(issue);
      const bodyMatch = prompt.match(/Description: ([^\n]+)/);
      
      expect(bodyMatch[1].length).toBe(2000);
    });
    
    test('should handle missing fields gracefully', () => {
      const issue = {};
      const prompt = orchestrator.buildAnalysisPrompt(issue);
      
      expect(prompt).toContain('Title: Untitled issue');
      expect(prompt).toContain('Description: No description provided');
      expect(prompt).toContain('Labels: None');
    });
  });
  
  describe('parseAnalysisResponse', () => {
    test('should parse valid JSON from markdown fences', () => {
      const issue = { title: 'Test' };
      const rawText = '```json\n{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}\n```';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(result).not.toBeNull();
      expect(result.summary).toBe('ok');
      expect(result.complexity).toBe('low');
      expect(result.sentiment).toBe('neutral');
    });
    
    test('should parse valid JSON without markdown fences', () => {
      const issue = { title: 'Test' };
      const rawText = '{"summary":"ok","complexity":"medium","priority":"high","sentiment":"negative","urgency":"critical"}';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(result).not.toBeNull();
      expect(result.summary).toBe('ok');
      expect(result.complexity).toBe('medium');
      expect(result.urgency).toBe('critical');
    });
    
    test('should normalize missing/invalid enum values', () => {
      const issue = { title: 'Test' };
      const rawText = '{"summary":"ok","complexity":"extreme","priority":"","sentiment":"unknown","urgency":"soon"}';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(result.complexity).toBe('medium');
      expect(result.priority).toBe('medium');
      expect(result.sentiment).toBe('neutral');
      expect(result.urgency).toBe('medium');
    });
    
    test('should normalize missing arrays and strings', () => {
      const issue = { title: 'Test' };
      const rawText = '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(Array.isArray(result.skillsRequired)).toBe(true);
      expect(Array.isArray(result.dependencies)).toBe(true);
      expect(Array.isArray(result.potentialRisks)).toBe(true);
      expect(result.estimatedEffort).toBe('4-8 hours');
      expect(result.recommendedApproach).toBe('');
    });
    
    test('should return null for completely invalid JSON', () => {
      const issue = { title: 'Test' };
      const rawText = 'This is not JSON at all.';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(result).toBeNull();
    });
    
    test('should use issue title as fallback summary', () => {
      const issue = { title: 'My Issue' };
      const rawText = '{"complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}';
      
      const result = orchestrator.parseAnalysisResponse(rawText, issue);
      
      expect(result.summary).toBe('My Issue');
    });
  });
  
  describe('renderStructuredAnalysis', () => {
    test('should render human-readable markdown from structured data', () => {
      const data = {
        summary: 'Fix timeout',
        complexity: 'high',
        priority: 'high',
        sentiment: 'negative',
        urgency: 'critical',
        estimatedEffort: '4-8 hours',
        recommendedApproach: 'Step 1\nStep 2',
        skillsRequired: ['Node.js', 'Monero'],
        dependencies: ['Dep A'],
        relatedAreas: ['Gateway'],
        potentialRisks: ['Risk 1'],
        suggestedBounty: '0.5 XMR'
      };
      
      const text = orchestrator.renderStructuredAnalysis(data);
      
      expect(text).toContain('**Summary:** Fix timeout');
      expect(text).toContain('**Complexity:** high');
      expect(text).toContain('**Sentiment:** negative');
      expect(text).toContain('**Urgency:** critical');
      expect(text).toContain('**Skills Required:** Node.js, Monero');
      expect(text).toContain('**Suggested Bounty:** 0.5 XMR');
      expect(text).toContain('- Step 1');
      expect(text).toContain('- Risk 1');
    });
    
    test('should handle empty arrays and strings gracefully', () => {
      const data = {
        summary: 'ok',
        complexity: 'medium',
        priority: 'medium',
        sentiment: 'neutral',
        urgency: 'medium',
        estimatedEffort: '',
        recommendedApproach: '',
        skillsRequired: [],
        dependencies: [],
        relatedAreas: [],
        potentialRisks: [],
        suggestedBounty: ''
      };
      
      const text = orchestrator.renderStructuredAnalysis(data);
      
      expect(text).toContain('**Skills Required:** N/A');
      expect(text).toContain('**Suggested Bounty:** N/A');
    });
  });
  
  describe('analyzeIssue - backward compatibility', () => {
    test('should always return analysis field for backward compatibility', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}' } }]
        }
      });
      
      const issue = { title: 'Test', body: 'Body', labels: [] };
      const result = await orchestrator.analyzeIssue(issue);
      
      expect(result).toHaveProperty('analysis');
      expect(typeof result.analysis).toBe('string');
      expect(result.analysis.length).toBeGreaterThan(0);
    });
    
    test('should include structured field when JSON parsing succeeds', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}' } }]
        }
      });
      
      const issue = { title: 'Test', body: 'Body', labels: [] };
      const result = await orchestrator.analyzeIssue(issue);
      
      expect(result).toHaveProperty('structured');
      expect(result.structured.summary).toBe('ok');
      expect(result.structured.sentiment).toBe('neutral');
    });
    
    test('should include model and timestamp', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}' } }]
        }
      });
      
      const issue = { title: 'Test', body: 'Body', labels: [] };
      const result = await orchestrator.analyzeIssue(issue);
      
      expect(result.model).toBe('deepseek');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
    
    test('should fall back to default analysis on API failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('API down'));
      
      const issue = { title: 'Test', body: 'Body', labels: [] };
      const result = await orchestrator.analyzeIssue(issue);
      
      expect(result.model).toBe('fallback');
      expect(result.analysis).toContain('Issue Analysis');
      expect(result.structured).toBeDefined();
      expect(result.structured.summary).toBe('Test');
    });
    
    test('should try Gemma fallback when DeepSeek fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('DeepSeek down'));
      mockPost.mockResolvedValueOnce({
        data: { response: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}' }
      });
      
      const issue = { title: 'Test', body: 'Body', labels: [] };
      const result = await orchestrator.analyzeIssue(issue);
      
      expect(result.model).toBe('gemma');
      expect(result.analysis).toContain('Issue Analysis');
      expect(result.structured.summary).toBe('ok');
    });
  });
  
  describe('summarizeIssues', () => {
    test('should batch analyze issues and include numbers', async () => {
      mockPost.mockResolvedValue({
        data: { choices: [{ message: { content: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low"}' } }] }
      });
      
      const issues = [
        { number: 1, title: 'A', body: 'Body A', labels: [] },
        { number: 2, title: 'B', body: 'Body B', labels: [] }
      ];
      
      const results = await orchestrator.summarizeIssues(issues);
      
      expect(results).toHaveLength(2);
      expect(results[0].number).toBe(1);
      expect(results[1].number).toBe(2);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('generateBountyDescription', () => {
    test('should include structured bounty fields', async () => {
      mockPost.mockResolvedValue({
        data: { choices: [{ message: { content: '{"summary":"ok","complexity":"low","priority":"low","sentiment":"neutral","urgency":"low","suggestedBounty":"0.5 XMR","skillsRequired":["Node.js"]}' } }] }
      });
      
      const issue = { title: 'Add feature', body: 'desc', labels: [] };
      const desc = await orchestrator.generateBountyDescription(issue);
      
      expect(desc).toContain('Add feature');
      expect(desc).toContain('0.5 XMR');
      expect(desc).toContain('Node.js');
      expect(desc).toContain('2 weeks');
    });
  });
});
