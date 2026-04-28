/**
 * Direct API Test for Damage Endpoint
 * Tests the actual production API
 */

const https = require('https');

const API_BASE = 'https://api.giftgala.in';

// Test data - use a product that has stock
const testPayload = {
    product_type: "bra Product 178",
    barcode: "433967585453",
    inventory_location: "GGM_WH",
    quantity: 1,
    action_type: "damage",
    processed_by: "Mahesh"
};

console.log('🧪 Testing Damage API Directly\n');
console.log('═══════════════════════════════════════════════\n');
console.log('📤 Request:');
console.log('   Endpoint:', `${API_BASE}/api/damage-recovery/damage`);
console.log('   Payload:', JSON.stringify(testPayload, null, 2));
console.log('\n═══════════════════════════════════════════════\n');

// You need to provide a valid token
const token = process.argv[2];

if (!token) {
    console.error('❌ Error: Token required!');
    console.log('\nUsage: node test-damage-api-direct.js YOUR_TOKEN\n');
    console.log('Get token from:');
    console.log('1. Login to your app');
    console.log('2. Open browser console');
    console.log('3. Run: localStorage.getItem("token")');
    console.log('4. Copy the token and run:');
    console.log('   node test-damage-api-direct.js "YOUR_TOKEN_HERE"\n');
    process.exit(1);
}

const postData = JSON.stringify(testPayload);

const options = {
    hostname: 'api.giftgala.in',
    port: 443,
    path: '/api/damage-recovery/damage',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
    }
};

const req = https.request(options, (res) => {
    console.log('📥 Response Status:', res.statusCode, res.statusMessage);
    console.log('');
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 201) {
                console.log('✅ SUCCESS!\n');
                console.log('Response:', JSON.stringify(response, null, 2));
                console.log('\n═══════════════════════════════════════════════');
                console.log('✅ Damage API is working correctly!');
                console.log('═══════════════════════════════════════════════\n');
            } else {
                console.log('❌ FAILED!\n');
                console.log('Response:', JSON.stringify(response, null, 2));
                console.log('\n═══════════════════════════════════════════════');
                console.log('❌ Error Details:');
                console.log('   Status:', res.statusCode);
                console.log('   Message:', response.message || 'Unknown error');
                console.log('═══════════════════════════════════════════════\n');
            }
        } catch (error) {
            console.error('❌ Parse Error:', error);
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error);
});

req.write(postData);
req.end();
