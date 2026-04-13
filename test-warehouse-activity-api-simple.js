// Simple test to verify warehouse order activity API is working
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, raw: data });
                } catch (e) {
                    resolve({ status: res.statusCode, data: null, raw: data });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testWarehouseActivityAPI() {
    try {
        console.log('🧪 Testing Warehouse Order Activity API...\n');

        // First, let's try to get a JWT token
        console.log('1. Getting JWT token...');
        const loginResponse = await makeRequest(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        if (loginResponse.status !== 200) {
            throw new Error(`Login failed: ${loginResponse.status} - ${loginResponse.raw}`);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token obtained');

        // Test GET /api/warehouse-order-activity
        console.log('\n2. Testing GET /api/warehouse-order-activity...');
        const getResponse = await makeRequest(`${API_BASE}/api/warehouse-order-activity`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${getResponse.status}`);
        
        if (getResponse.status === 200) {
            console.log('✅ GET request successful');
            console.log(`📊 Found ${getResponse.data?.data?.length || 0} warehouse order activities`);
            
            if (getResponse.data?.data && getResponse.data.data.length > 0) {
                console.log('\n📋 Sample data:');
                console.log(JSON.stringify(getResponse.data.data[0], null, 2));
            } else {
                console.log('ℹ️  No data found in warehouse_order_activity table');
            }
        } else {
            console.log('❌ GET request failed');
            console.log('Error:', getResponse.raw);
        }

        console.log('\n🎉 Warehouse Order Activity API test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testWarehouseActivityAPI();