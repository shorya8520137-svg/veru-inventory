/**
 * Complete automated test:
 * 1. Login to get token
 * 2. Test damage API
 */

const https = require('https');

const API_BASE = 'https://api.giftgala.in';
const LOGIN_EMAIL = 'admin@company.com';
const LOGIN_PASSWORD = 'Admin@123';

console.log('🔐 Step 1: Logging in to get token...\n');

// Step 1: Login
const loginData = JSON.stringify({
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD
});

const loginOptions = {
    hostname: 'api.giftgala.in',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

const loginReq = https.request(loginOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && response.token) {
                const token = response.token;
                console.log('✅ Login successful!');
                console.log('   Token:', token.substring(0, 50) + '...\n');
                
                // Step 2: Test damage API
                testDamageAPI(token);
            } else {
                console.error('❌ Login failed!');
                console.log('Response:', JSON.stringify(response, null, 2));
            }
        } catch (error) {
            console.error('❌ Parse error:', error);
            console.log('Raw response:', data);
        }
    });
});

loginReq.on('error', (error) => {
    console.error('❌ Login request error:', error);
});

loginReq.write(loginData);
loginReq.end();

// Function to test damage API
function testDamageAPI(token) {
    console.log('═══════════════════════════════════════════════');
    console.log('🧪 Step 2: Testing Damage API\n');
    
    const testPayload = {
        product_type: "Test Product Alpha",
        barcode: "TEST001234567890",
        inventory_location: "GGM_WH",
        quantity: 5,
        action_type: "damage",
        processed_by: "Mahesh"
    };
    
    console.log('📤 Request:');
    console.log('   Endpoint:', `${API_BASE}/api/damage-recovery/damage`);
    console.log('   Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');
    
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
                
                console.log('Response:', JSON.stringify(response, null, 2));
                console.log('\n═══════════════════════════════════════════════');
                
                if (res.statusCode === 201) {
                    console.log('✅ SUCCESS! Damage API is working!');
                    console.log('═══════════════════════════════════════════════\n');
                    console.log('📊 Result:');
                    console.log('   Damage ID:', response.damage_id);
                    console.log('   Product:', response.product_type);
                    console.log('   Barcode:', response.barcode);
                    console.log('   Location:', response.inventory_location);
                    console.log('   Quantity:', response.quantity);
                    console.log('   Stock Updated:', response.stock_updated);
                    console.log('   Reference:', response.reference);
                    console.log('\n✅ API is working correctly!');
                    console.log('   Problem is in FRONTEND (duplicate submission)');
                } else {
                    console.log('❌ FAILED!');
                    console.log('═══════════════════════════════════════════════\n');
                    console.log('Error Details:');
                    console.log('   Status:', res.statusCode);
                    console.log('   Message:', response.message || 'Unknown error');
                    
                    if (response.message && response.message.includes('Insufficient stock')) {
                        console.log('\n⚠️  Stock Issue:');
                        console.log('   This product does not have enough stock');
                        console.log('   Check inventory page for current stock');
                    }
                }
                
                console.log('\n═══════════════════════════════════════════════\n');
                
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
}
