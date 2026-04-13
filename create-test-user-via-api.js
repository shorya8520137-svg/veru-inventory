#!/usr/bin/env node

/**
 * Create Test User via API for Order Testing
 */

const https = require('https');

// Configuration
const config = {
    baseUrl: 'https://54.169.31.95:8443'
};

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper method to make HTTP requests
async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, config.baseUrl);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
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
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        headers: res.headers
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

async function createTestUser() {
    try {
        console.log('🔍 Checking server health...');
        
        // Check server health
        const healthResponse = await makeRequest('GET', '/');
        if (healthResponse.statusCode !== 200) {
            throw new Error('Server is not responding properly');
        }
        console.log('✅ Server is running');

        // Try to register a new test user
        console.log('👤 Creating test user...');
        
        const userData = {
            username: 'ordertest',
            email: 'ordertest@example.com',
            password: 'testpass123',
            firstName: 'Order',
            lastName: 'Tester'
        };

        const registerResponse = await makeRequest('POST', '/api/auth/register', userData);
        
        if (registerResponse.statusCode === 201 || registerResponse.statusCode === 200) {
            console.log('✅ Test user created successfully');
            console.log('   Username: ordertest');
            console.log('   Password: testpass123');
            console.log('   Email: ordertest@example.com');
        } else if (registerResponse.statusCode === 409) {
            console.log('ℹ️ Test user already exists');
        } else {
            console.log('⚠️ User creation response:', registerResponse.data);
        }

        // Test login
        console.log('\n🔐 Testing login...');
        
        const loginData = {
            username: 'ordertest',
            password: 'testpass123'
        };

        const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (loginResponse.statusCode === 200 && loginResponse.data.success) {
            console.log('✅ Login test successful');
            console.log('   Token received:', loginResponse.data.token.substring(0, 20) + '...');
            
            // Test a protected endpoint
            console.log('\n🔒 Testing protected endpoint...');
            
            const headers = {
                'Authorization': `Bearer ${loginResponse.data.token}`
            };
            
            const protectedResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=1', null, headers);
            
            if (protectedResponse.statusCode === 200) {
                console.log('✅ Protected endpoint access successful');
                console.log('   Orders endpoint is working');
            } else {
                console.log('⚠️ Protected endpoint response:', protectedResponse.statusCode, protectedResponse.data);
            }
            
        } else {
            console.log('❌ Login test failed:', loginResponse.data);
        }

        console.log('\n🎉 Test user setup completed!');
        console.log('\nYou can now run the order API tests with:');
        console.log('  Username: ordertest');
        console.log('  Password: testpass123');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
createTestUser().catch(console.error);