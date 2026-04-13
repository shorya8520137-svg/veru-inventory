// Test the warehouse staff endpoint
const https = require('https');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            rejectUnauthorized: false, // For self-signed certificates
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

async function testWarehouseStaffEndpoint() {
    try {
        console.log('🧪 Testing Warehouse Staff Endpoint...\n');

        const API_BASE = 'https://18.143.163.44:8443';

        // First, get a JWT token
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

        // Test the warehouse staff endpoint
        console.log('\n2. Testing GET /api/warehouse-order-activity/warehouse-staff...');
        const staffResponse = await makeRequest(`${API_BASE}/api/warehouse-order-activity/warehouse-staff`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${staffResponse.status}`);
        
        if (staffResponse.status === 200) {
            console.log('✅ Warehouse staff endpoint working!');
            console.log('Response:', JSON.stringify(staffResponse.data, null, 2));
        } else {
            console.log('❌ Warehouse staff endpoint failed');
            console.log('Error:', staffResponse.raw);
        }

        // Test the main warehouse order activity endpoint
        console.log('\n3. Testing GET /api/warehouse-order-activity...');
        const activitiesResponse = await makeRequest(`${API_BASE}/api/warehouse-order-activity`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${activitiesResponse.status}`);
        
        if (activitiesResponse.status === 200) {
            console.log('✅ Main endpoint working!');
            console.log(`Found ${activitiesResponse.data?.data?.length || 0} activities`);
        } else {
            console.log('❌ Main endpoint failed');
            console.log('Error:', activitiesResponse.raw);
        }

        console.log('\n🎉 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testWarehouseStaffEndpoint();