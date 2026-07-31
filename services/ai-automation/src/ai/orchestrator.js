/**
 * AI Orchestrator - Gestisce l'analisi degli issue con prompt engineering avanzato
 * 
 * Miglioramenti implementati:
 * - Few-shot learning per analisi più accurate
 * - Output JSON strutturato
 * - Analisi del sentiment
 * - Estrazione avanzata di campi (complessità, priorità, skills, ecc.)
 */

class AIOrchestrator {
    constructor(config = {}) {
        this.config = {
            model: config.model || 'gpt-4',
            temperature: config.temperature || 0.3,
            maxTokens: config.maxTokens || 2000,
            ...config
        };
        
        // Prompt base per l'analisi degli issue
        this.basePrompt = `
Sei un assistente AI specializzato nell'analisi di issue su GitHub. 
Il tuo compito è analizzare il testo dell'issue e restituire un'analisi strutturata.

# ISTRUZIONI
1. Leggi attentamente il titolo e la descrizione dell'issue
2. Estrai le informazioni chiave
3. Fornisci una valutazione oggettiva
4. Restituisci l'output in formato JSON

# ESEMPI (Few-shot learning)

## Esempio 1: Bug critico
Input: "Bug: Il servizio di autenticazione non risponde dopo il deploy. Errore 500 su /api/auth/login. Blocca tutti gli utenti."
Output:
{
    "type": "bug",
    "severity": "critical",
    "complexity": "medium",
    "priority": 1,
    "sentiment": "negative",
    "urgency": "high",
    "summary": "Servizio di autenticazione non funzionante dopo il deploy",
    "details": {
        "error": "500 su /api/auth/login",
        "impact": "Blocca tutti gli utenti",
        "context": "Post-deploy"
    },
    "skills_required": ["backend", "authentication", "debugging"],
    "estimated_effort": "4-8 hours",
    "recommendations": [
        "Controllare i log del server",
        "Verificare le variabili d'ambiente",
        "Rivedere le configurazioni di deploy"
    ]
}

## Esempio 2: Feature enhancement
Input: "Feature Request: Aggiungere il supporto per l'analisi del sentiment nei commenti degli issue. Utile per priorizzare le richieste."
Output:
{
    "type": "enhancement",
    "severity": "minor",
    "complexity": "medium",
    "priority": 3,
    "sentiment": "positive",
    "urgency": "low",
    "summary": "Implementare analisi del sentiment nei commenti",
    "details": {
        "benefit": "Migliore priorizzazione delle richieste",
        "use_case": "Analisi commenti issue"
    },
    "skills_required": ["nlp", "machine-learning", "backend"],
    "estimated_effort": "2-3 days",
    "recommendations": [
        "Ricercare librerie NLP esistenti",
        "Implementare come servizio separato",
        "Aggiungere test di accuratezza"
    ]
}

## Esempio 3: Documentazione
Input: "Docs: La documentazione dell'API REST è incompleta. Mancano gli esempi per gli endpoint /users e /auth."
Output:
{
    "type": "documentation",
    "severity": "minor",
    "complexity": "low",
    "priority": 4,
    "sentiment": "neutral",
    "urgency": "medium",
    "summary": "Documentazione API incompleta",
    "details": {
        "missing_endpoints": ["/users", "/auth"],
        "issue_type": "esempi mancanti"
    },
    "skills_required": ["technical-writing", "api-documentation"],
    "estimated_effort": "2-4 hours",
    "recommendations": [
        "Aggiungere esempi di richieste e risposte",
        "Includere casi d'uso comuni"
    ]
}

# REGOLE PER L'ANALISI
- Severity: critical, high, medium, minor
- Complexity: low, medium, high, very-high
- Priority: 1 (più alta) a 5 (più bassa)
- Sentiment: positive, neutral, negative
- Urgency: immediate, high, medium, low

# DATI DA ANALIZZARE
Titolo: {title}
Descrizione: {body}
Labels: {labels}
`;

        // Sistema di caching per i prompt
        this.promptCache = new Map();
    }

    /**
     * Analizza un issue e restituisce un'analisi strutturata
     * @param {Object} issueData - Dati dell'issue (title, body, labels, comments, ecc.)
     * @returns {Promise<Object>} - Analisi strutturata in JSON
     */
    async analyzeIssue(issueData) {
        try {
            // Validazione input
            this._validateIssueData(issueData);
            
            // Preparazione del prompt
            const prompt = this._buildPrompt(issueData);
            
            // Chiamata al modello AI
            const analysis = await this._callAI(prompt);
            
            // Parsing e validazione dell'output
            const structuredOutput = this._parseOutput(analysis);
            
            // Arricchimento con metadata
            return this._enrichAnalysis(structuredOutput, issueData);
            
        } catch (error) {
            console.error('Errore nell\'analisi AI:', error);
            return this._getFallbackAnalysis(issueData);
        }
    }

    /**
     * Costruisce il prompt completo con esempi few-shot
     * @param {Object} issueData 
     * @returns {string}
     */
    _buildPrompt(issueData) {
        const cacheKey = `${issueData.title}_${issueData.body ? issueData.body.substring(0, 100) : ''}`;
        
        if (this.promptCache.has(cacheKey)) {
            return this.promptCache.get(cacheKey);
        }
        
        const prompt = this.basePrompt
            .replace('{title}', issueData.title || 'N/A')
            .replace('{body}', issueData.body || 'N/A')
            .replace('{labels}', issueData.labels ? issueData.labels.join(', ') : 'N/A');
        
        // Cache per evitare ricostruzioni inutili (limite 100)
        if (this.promptCache.size < 100) {
            this.promptCache.set(cacheKey, prompt);
        }
        
        return prompt;
    }

    /**
     * Chiamata al modello AI
     * @param {string} prompt 
     * @returns {Promise<string>}
     */
    async _callAI(prompt) {
        // TODO: Implementare chiamata reale a OpenAI/LLM
        // Per ora, simuliamo l'analisi
        return this._simulateAIAnalysis(prompt);
    }

    /**
     * Simula l'analisi AI (da sostituire con chiamata reale)
     * @param {string} prompt 
     * @returns {string}
     */
    _simulateAIAnalysis(prompt) {
        // Estrai il titolo e la descrizione dal prompt
        const titleMatch = prompt.match(/Titolo: (.+)/);
        const bodyMatch = prompt.match(/Descrizione: (.+)/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const body = bodyMatch ? bodyMatch[1] : '';
        
        // Analisi simulata basata sul contenuto
        const isBug = body.toLowerCase().includes('bug') || 
                     body.toLowerCase().includes('errore') || 
                     body.toLowerCase().includes('error') ||
                     body.toLowerCase().includes('crash');
                     
        const isEnhancement = body.toLowerCase().includes('feature') || 
                            body.toLowerCase().includes('aggiungere') ||
                            body.toLowerCase().includes('migliorare');
                            
        const isDocumentation = body.toLowerCase().includes('doc') || 
                              body.toLowerCase().includes('documentazione');
        
        const hasUrgency = body.toLowerCase().includes('urgente') || 
                         body.toLowerCase().includes('critical');
        
        // Determinazione del tipo
        let type = 'other';
        if (isBug) type = 'bug';
        else if (isEnhancement) type = 'enhancement';
        else if (isDocumentation) type = 'documentation';
        
        // Determinazione della severità
        let severity = 'medium';
        if (body.toLowerCase().includes('critical') || body.toLowerCase().includes('blocca')) severity = 'critical';
        else if (body.toLowerCase().includes('high') || body.toLowerCase().includes('grave')) severity = 'high';
        else if (body.toLowerCase().includes('minor') || body.toLowerCase().includes('piccolo')) severity = 'minor';
        
        // Determinazione della complessità
        let complexity = 'medium';
        if (body.split(' ').length > 100) complexity = 'high';
        else if (body.split(' ').length < 30) complexity = 'low';
        
        // Analisi del sentiment
        let sentiment = 'neutral';
        if (body.toLowerCase().includes('grazie') || body.toLowerCase().includes('perfetto')) sentiment = 'positive';
        else if (body.toLowerCase().includes('non funziona') || body.toLowerCase().includes('problema')) sentiment = 'negative';
        
        // Urgenza
        let urgency = 'medium';
        if (hasUrgency || severity === 'critical') urgency = 'high';
        else if (type === 'documentation') urgency = 'low';
        
        // Skills richieste
        const skills = [];
        if (isBug) skills.push('debugging');
        if (body.toLowerCase().includes('api')) skills.push('backend');
        if (body.toLowerCase().includes('frontend')) skills.push('frontend');
        if (body.toLowerCase().includes('database')) skills.push('database');
        if (body.toLowerCase().includes('testing')) skills.push('testing');
        if (body.toLowerCase().includes('devops')) skills.push('devops');
        
        if (skills.length === 0) skills.push('general');
        
        return JSON.stringify({
            type,
            severity,
            complexity,
            priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : severity === 'medium' ? 3 : 4,
            sentiment,
            urgency,
            summary: title || 'Analisi automatica',
            details: {
                analysis: 'Analisi simulata. Integrare con LLM reale per risultati migliori.',
                word_count: body.split(' ').length
            },
            skills_required: skills,
            estimated_effort: severity === 'critical' ? '1-2 hours' : complexity === 'high' ? '1-2 days' : '4-8 hours',
            recommendations: this._generateRecommendations(type, severity)
        });
    }

    /**
     * Genera raccomandazioni basate sul tipo e severità
     * @param {string} type 
     * @param {string} severity 
     * @returns {string[]}
     */
    _generateRecommendations(type, severity) {
        const recommendations = [];
        
        if (type === 'bug') {
            recommendations.push('Riprodurre il bug in ambiente di test');
            if (severity === 'critical') {
                recommendations.push('Hotfix immediato');
                recommendations.push('Comunicare il downtime agli utenti');
            }
            recommendations.push('Aggiungere test di regressione');
        } else if (type === 'enhancement') {
            recommendations.push('Analizzare i requisiti dettagliati');
            recommendations.push('Prototipo rapido per validare la soluzione');
        } else if (type === 'documentation') {
            recommendations.push('Rivedere la struttura della documentazione');
            recommendations.push('Aggiungere esempi pratici');
        }
        
        recommendations.push('Aggiornare la documentazione dopo l\'implementazione');
        
        return recommendations.slice(0, 4);
    }

    /**
     * Parser dell'output AI
     * @param {string} output 
     * @returns {Object}
     */
    _parseOutput(output) {
        try {
            // Cerchiamo JSON nell'output
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('JSON non trovato nell\'output');
        } catch (error) {
            console.warn('Errore nel parsing dell\'output AI:', error);
            return {
                type: 'unknown',
                severity: 'medium',
                complexity: 'medium',
                priority: 3,
                sentiment: 'neutral',
                urgency: 'medium',
                summary: 'Analisi non parsata',
                details: { raw_output: output },
                skills_required: ['general'],
                estimated_effort: 'TBD',
                recommendations: ['Richiede analisi manuale']
            };
        }
    }

    /**
     * Arricchisce l'analisi con metadata
     * @param {Object} analysis 
     * @param {Object} issueData 
     * @returns {Object}
     */
    _enrichAnalysis(analysis, issueData) {
        return {
            ...analysis,
            metadata: {
                analyzed_at: new Date().toISOString(),
                issue_id: issueData.id || 'unknown',
                issue_url: issueData.url || 'unknown',
                model: this.config.model,
                version: '1.0.0'
            },
            confidence: this._calculateConfidence(analysis, issueData)
        };
    }

    /**
     * Calcola un punteggio di confidenza per l'analisi
     * @param {Object} analysis 
     * @param {Object} issueData 
     * @returns {number}
     */
    _calculateConfidence(analysis, issueData) {
        let score = 0.7; // Base
        
        // Più informazioni abbiamo, maggiore è la confidenza
        if (issueData.body && issueData.body.length > 50) score += 0.1;
        if (issueData.labels && issueData.labels.length > 0) score += 0.1;
        if (issueData.comments && issueData.comments.length > 2) score += 0.1;
        
        // Se l'analisi ha campi completi
        const requiredFields = ['type', 'severity', 'complexity', 'priority'];
        const hasAllFields = requiredFields.every(f => analysis[f] !== undefined);
        if (hasAllFields) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    /**
     * Analisi di fallback quando l'AI fallisce
     * @param {Object} issueData 
     * @returns {Object}
     */
    _getFallbackAnalysis(issueData) {
        return {
            type: 'unknown',
            severity: 'medium',
            complexity: 'medium',
            priority: 3,
            sentiment: 'neutral',
            urgency: 'medium',
            summary: issueData.title || 'Analisi fallita',
            details: {
                error: 'AI analysis failed',
                fallback: true
            },
            skills_required: ['general'],
            estimated_effort: 'TBD',
            recommendations: ['Richiede analisi manuale'],
            metadata: {
                analyzed_at: new Date().toISOString(),
                fallback: true
            },
            confidence: 0.3
        };
    }

    /**
     * Validazione dei dati dell'issue
     * @param {Object} issueData 
     * @throws {Error}
     */
    _validateIssueData(issueData) {
        if (!issueData || typeof issueData !== 'object') {
            throw new Error('issueData deve essere un oggetto');
        }
        if (!issueData.title) {
            throw new Error('issueData.title è richiesto');
        }
    }

    /**
     * Metodo per aggiornare il prompt base (utile per testing)
     * @param {string} newPrompt 
     */
    updateBasePrompt(newPrompt) {
        this.basePrompt = newPrompt;
        this.promptCache.clear();
    }

    /**
     * Metodo per resettare la cache
     */
    clearCache() {
        this.promptCache.clear();
    }

    /**
     * Batch analysis per più issue
     * @param {Array<Object>} issues 
     * @param {number} concurrency 
     * @returns {Promise<Array<Object>>}
     */
    async analyzeBatch(issues, concurrency = 3) {
        const results = [];
        const chunks = [];
        
        for (let i = 0; i < issues.length; i += concurrency) {
            chunks.push(issues.slice(i, i + concurrency));
        }
        
        for (const chunk of chunks) {
            const promises = chunk.map(issue => this.analyzeIssue(issue));
            const chunkResults = await Promise.allSettled(promises);
            
            for (const result of chunkResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error('Errore in batch analysis:', result.reason);
                    results.push({
                        error: true,
                        message: result.reason.message,
                        type: 'error'
                    });
                }
            }
        }
        
        return results;
    }

    /**
     * Analisi con streaming (per grandi issue)
     * @param {Object} issueData 
     * @param {Function} onProgress 
     * @returns {Promise<Object>}
     */
    async analyzeWithProgress(issueData, onProgress) {
        const steps = ['validation', 'prompt_building', 'ai_call', 'parsing', 'enrichment'];
        
        for (const step of steps) {
            if (onProgress) onProgress(step, `Esecuzione: ${step}`);
            await this._sleep(100); // Simula lavoro
        }
        
        return this.analyzeIssue(issueData);
    }

    /**
     * Helper per sleep
     * @param {number} ms 
     * @returns {Promise}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AIOrchestrator;
