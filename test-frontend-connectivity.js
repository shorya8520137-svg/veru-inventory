#!/usr/bin/env node

/**
 * Frontend Connectivity Test
 * Tests the frontend API integration for Website Products
 */

const https = require('https');

// Simulate frontend environment
const NEXT_PUBLIC_API_BASE = 'https://54.169.31.95:8443';

function makeAPIRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, NEXT_PUBLIC_API_BASE);
        
        const requestOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            rejectUnauthorized: false,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsed,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        success: false
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Request failed: ${err.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testFrontendConnectivity() {
    console.log('🌐 Testing Frontend API Connectivity');
    console.log('====================================');
    console.log(`API Base URL: ${NEXT_PUBLIC_API_BASE}`);
    console.log('');

    const tests = [
        {
            name: 'Health Check',
            endpoint: '/api/health',
            description: 'Basic server connectivity'
        },
        {
            name: 'Auth Endpoint',
            endpoint: '/api/auth/login',
            method: 'POST',
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test'
            }),
            description: 'Authentication endpoint availability'
        },
        {
            name: 'Website Categories (Public)',
            endpoint: '/api/website/categories',
            description: 'Public categories endpoint (should work without auth)'
        },
        {
            name: 'Website Products (Public)',
            endpoint: '/api/website/products',
            description: 'Public products endpoint (should work without auth)'
        },
        {
            name: 'Website Featured Products',
            endpoint: '/api/website/products/featured',
            description: 'Featured products endpoint'
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        try {
            console.log(`🧪 ${test.name}`);
            console.log(`   ${test.description}`);
            
            const result = await makeAPIRequest(test.endpoint, {
                method: test.method,
                body: test.body
            });

            if (result.success) {
                console.log(`   ✅ PASS - Status: ${result.statusCode}`);
                passedTests++;
            } else {
                console.log(`   ❌ FAIL - Status: ${result.statusCode}`);
                if (result.data && typeof result.data === 'object') {
                    console.log(`   Error: ${result.data.message || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ FAIL - ${error.message}`);
        }
        console.log('');
    }

    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 All frontend connectivity tests passed!');
        return true;
    } else {
        console.log('\n⚠️  Some frontend connectivity issues detected.');
        return false;
    }
}

// Test environment variables
console.log('🔧 Environment Check');
console.log('====================');
console.log(`NEXT_PUBLIC_API_BASE: ${NEXT_PUBLIC_API_BASE}`);
console.log('');

testFrontendConnectivity().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});