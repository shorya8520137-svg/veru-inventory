const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testWebsiteOrdersEndpoint() {
    console.log('🧪 Testing Website Orders API Endpoint...\n');

    try {
        // Test different login credentials
        const credentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'admin', password: 'admin' },
            { username: 'testuser', password: 'testpass' },
            { username: 'user1', password: 'password123' }
        ];

        let token = null;

        for (const cred of credentials) {
            console.log(`🔐 Trying login with ${cred.username}...`);
            const loginResponse = await makeRequest('POST', '/api/auth/login', cred);
            
            if (loginResponse.status === 200 && loginResponse.data.success) {
                token = loginResponse.data.token;
                console.log(`✅ Login successful with ${cred.username}`);
                break;
            } else {
                console.log(`❌ Login failed with ${cred.username}:`, loginResponse.data.message);
            }
        }

        if (!token) {
            console.log('\n❌ Could not authenticate with any credentials');
            console.log('Let\'s test the endpoint without authentication...\n');
            
            // Test GET orders without auth
            console.log('📋 Testing GET /api/website/orders without auth...');
            const getOrdersResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=10');
            
            console.log(`Status: ${getOrdersResponse.status}`);
            console.log('Response:', JSON.stringify(getOrdersResponse.data, null, 2));
            return;
        }

        // Test with valid token
        console.log('\n📋 Testing GET /api/website/orders with auth...');
        const getOrdersResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=10', null, token);
        
        console.log(`Status: ${getOrdersResponse.status}`);
        console.log('Response:', JSON.stringify(getOrdersResponse.data, null, 2));

        if (getOrdersResponse.status === 200) {
            console.log('✅ Website orders endpoint is working!');
        } else if (getOrdersResponse.status === 404) {
            console.log('❌ Website orders endpoint not found - route may not be registered');
        } else {
            console.log('❌ Website orders endpoint returned error');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testWebsiteOrdersEndpoint();