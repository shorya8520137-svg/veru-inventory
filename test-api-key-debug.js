const https = require('https');

const API_TOKEN = 'wk_live_42813b1aed27e83ea88b1dc8c7c0bb8830c1323412df3027cf2588f69d730a01';
const API_BASE = 'https://api.giftgala.in';

// Create HTTPS agent that accepts self-signed certificates
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function debugAPIKey() {
    console.log('🔍 Debugging API Key Authentication\n');
    
    // Test with X-API-Key header
    console.log('Test 1: Using X-API-Key header');
    console.log('Headers:', { 'X-API-Key': API_TOKEN.substring(0, 20) + '...' });
    
    try {
        const response = await fetch(`${API_BASE}/api/timeline`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_TOKEN
            },
            agent
        });

        console.log('Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.log('Error:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test with Authorization Bearer header
    console.log('Test 2: Using Authorization Bearer header');
    console.log('Headers:', { 'Authorization': 'Bearer ' + API_TOKEN.substring(0, 20) + '...' });
    
    try {
        const response = await fetch(`${API_BASE}/api/timeline`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`
            },
            agent
        });

        console.log('Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.log('Error:', error.message);
    }
}

debugAPIKey();
