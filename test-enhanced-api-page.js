#!/usr/bin/env node

/**
 * Test Enhanced API Page Functionality
 * Verifies that the API endpoints are accessible and working
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

async function testApiEndpoints() {
    console.log('🚀 Testing Enhanced API Page Endpoints...\n');

    const tests = [
        {
            name: 'Server Health Check',
            method: 'GET',
            path: '/',
            expectStatus: 200
        },
        {
            name: 'Website Products (Public)',
            method: 'GET',
            path: '/api/website/products',
            expectStatus: 200
        },
        {
            name: 'Website Categories (Public)',
            method: 'GET',
            path: '/api/website/categories',
            expectStatus: 200
        },
        {
            name: 'Website Orders (Requires Auth)',
            method: 'GET',
            path: '/api/website/orders',
            expectStatus: 401 // Should require authentication
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            
            const response = await makeRequest(test.method, test.path);
            
            if (response.statusCode === test.expectStatus) {
                console.log(`✅ PASS - ${test.name} (${response.statusCode})`);
                passed++;
            } else {
                console.log(`❌ FAIL - ${test.name} (Expected: ${test.expectStatus}, Got: ${response.statusCode})`);
                failed++;
            }
            
            // Show response data for successful calls
            if (response.statusCode === 200 && response.data) {
                if (response.data.success !== undefined) {
                    console.log(`   Response: ${response.data.success ? 'Success' : 'Failed'}`);
                    if (response.data.data && Array.isArray(response.data.data)) {
                        console.log(`   Records: ${response.data.data.length}`);
                    }
                } else if (response.data.status) {
                    console.log(`   Status: ${response.data.status}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ ERROR - ${test.name}: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }

    console.log('='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 All API endpoints are working correctly!');
        console.log('The enhanced API page should now provide:');
        console.log('• Organized API documentation');
        console.log('• Token generation functionality');
        console.log('• Interactive API testing');
        console.log('• Complete order management API');
        console.log('• Copy-to-clipboard functionality');
    } else {
        console.log('\n⚠️ Some endpoints need attention. Check the server configuration.');
    }

    return failed === 0;
}

// Run the tests
testApiEndpoints()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });