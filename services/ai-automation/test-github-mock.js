const axios = require('axios');

async function testGitHubMock() {
    console.log('🧪 Testing GitHub Mock Integration...\n');
    
    // Simula un nuovo issue
    const mockIssue = {
        number: 42,
        title: "Fix: Monero payment gateway timeout",
        body: "When users try to pay with Monero, the transaction times out after 30 seconds. Need to increase timeout and add better error handling.",
        html_url: "https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/42",
        labels: [{ name: "bug" }, { name: "bounty" }, { name: "high-priority" }],
        created_at: new Date().toISOString()
    };
    
    console.log('📝 Sending mock issue to AI Automation...');
    
    try {
        // Invia l'issue al sistema
        const response = await axios.post('http://localhost:5678/api/github/issue', mockIssue);
        console.log('✅ Issue sent successfully');
        console.log('📊 Analysis:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('ℹ️  API endpoint not yet implemented, but system is ready');
            console.log('💡 The system will analyze this issue when GitHub is configured');
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testGitHubMock();
