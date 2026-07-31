const axios = require('axios');

async function testAIComplete() {
    console.log('🧪 Testing Complete AI Integration...\n');
    
    const issue = {
        title: "Add Monero (XMR) payment support for bounties",
        body: "We need to integrate Monero cryptocurrency payments into MyZubster's bounty system. Users should be able to create bounties and pay contributors in XMR.",
        labels: [{ name: "bounty" }, { name: "cryptocurrency" }, { name: "enhancement" }]
    };
    
    const prompt = `
Analyze this GitHub issue for MyZubster:

Title: ${issue.title}
Description: ${issue.body}
Labels: ${issue.labels.map(l => l.name).join(', ')}

Provide a structured analysis with:

1. **Summary** (1-2 sentences)
2. **Complexity** (Low/Medium/High with reasoning)
3. **Priority** (Low/Medium/High with reasoning)
4. **Technical Approach** (Step by step)
5. **Estimated Effort** (in hours)
6. **Dependencies** (What needs to be done first)
7. **Potential Risks**
8. **Suggested Bounty Amount** (in XMR or USD)

Format with clear sections.
    `;
    
    console.log('🤖 Analyzing with Gemma...\n');
    
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'gemma:2b',
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.3,
                max_tokens: 800
            }
        });
        
        console.log('📊 Analysis Results:');
        console.log('='.repeat(60));
        console.log(response.data.response);
        console.log('='.repeat(60));
        console.log('\n✅ AI Integration Complete!');
        
        // Try Llama as well
        console.log('\n🔄 Testing with Llama 3.2 for comparison...');
        const llamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:3b',
            prompt: `In one sentence, describe how to implement Monero payments in a web app.`,
            stream: false,
            options: {
                temperature: 0.3,
                max_tokens: 100
            }
        });
        console.log(`📝 Llama says: ${llamaResponse.data.response}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAIComplete();
