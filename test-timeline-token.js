const https = require('https');

const API_TOKEN = 'wk_live_2848739b35b3a50207e5b9e56795ec52e8d5aecfbf74bc41e95dd593af4f1059';
const API_BASE = 'https://api.giftgala.in';

// Create HTTPS agent that accepts self-signed certificates
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testTimelineAPI() {
    console.log('🧪 Testing Timeline API with Generated Token\n');
    console.log('Token:', API_TOKEN.substring(0, 20) + '...\n');

    // Test 1: Get Timeline Summary
    console.log('📊 Test 1: Get Timeline Summary');
    console.log('URL:', `${API_BASE}/api/timeline`);
    
    try {
        const response1 = await fetch(`${API_BASE}/api/timeline`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            },
            agent
        });

        console.log('Status:', response1.status, response1.statusText);
        const data1 = await response1.json();
        console.log('Response:', JSON.stringify(data1, null, 2));
        
        if (response1.ok) {
            console.log('✅ Timeline Summary API works with generated token!\n');
        } else {
            console.log('❌ Timeline Summary API failed\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }

    // Test 2: Get Timeline Summary with Authorization Bearer
    console.log('📊 Test 2: Get Timeline Summary (Bearer Token)');
    console.log('URL:', `${API_BASE}/api/timeline`);
    
    try {
        const response2 = await fetch(`${API_BASE}/api/timeline`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            agent
        });

        console.log('Status:', response2.status, response2.statusText);
        const data2 = await response2.json();
        console.log('Response:', JSON.stringify(data2, null, 2));
        
        if (response2.ok) {
            console.log('✅ Timeline API works with Bearer token!\n');
        } else {
            console.log('❌ Timeline API failed with Bearer token\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }

    // Test 3: Get Product Timeline (if we have a product code)
    console.log('📊 Test 3: Get Product Timeline (Sample Product)');
    const sampleProductCode = 'TEST001'; // Replace with actual product code
    console.log('URL:', `${API_BASE}/api/timeline/${sampleProductCode}`);
    
    try {
        const response3 = await fetch(`${API_BASE}/api/timeline/${sampleProductCode}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            },
            agent
        });

        console.log('Status:', response3.status, response3.statusText);
        const data3 = await response3.json();
        console.log('Response:', JSON.stringify(data3, null, 2));
        
        if (response3.ok) {
            console.log('✅ Product Timeline API works!\n');
        } else {
            console.log('❌ Product Timeline API failed (might be no data for this product)\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }

    console.log('✅ Timeline API Testing Complete!');
}

testTimelineAPI();
