#!/usr/bin/env node

const https = require('https');

// Test function
function testAPI(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            rejectUnauthorized: false,
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`${method} ${path} -> Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    console.log('Response:', JSON.stringify(parsed, null, 2));
                } catch (e) {
                    console.log('Raw response:', data);
                }
                console.log('---');
                resolve({ statusCode: res.statusCode, data });
            });
        });

        req.on('error', (err) => {
            console.log(`${method} ${path} -> Error: ${err.message}`);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`${method} ${path} -> Timeout`);
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runQuickTests() {
    console.log('🔍 Quick API Test - Website Products');
    console.log('=====================================');

    try {
        // Test public routes
        await testAPI('/api/website/categories');
        await testAPI('/api/website/products');
        await testAPI('/api/website/products/featured');
        
        // Test a protected route without auth
        await testAPI('/api/website/products', 'POST');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runQuickTests();