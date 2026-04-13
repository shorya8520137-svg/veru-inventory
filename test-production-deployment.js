#!/usr/bin/env node

/**
 * Test Production Deployment
 * Verifies that the enhanced API access system is working in production
 */

const https = require('https');

// Configuration
const config = {
    frontendUrl: 'https://inventoryfullstack-one.vercel.app',
    backendUrl: 'https://54.169.31.95:8443'
};

// Disable SSL verification for self-signed certificates (backend only)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Helper method to make HTTP requests
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Production-Test-Bot/1.0',
                ...headers
            },
            rejectUnauthorized: urlObj.hostname !== '54.169.31.95' // Only disable for backend
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    let parsedData;
                    if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
                        parsedData = JSON.parse(responseData);
                    } else {
                        parsedData = responseData;
                    }
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

async function testProductionDeployment() {
    console.log('🚀 Testing Production Deployment...\n');
    console.log(`Frontend: ${config.frontendUrl}`);
    console.log(`Backend: ${config.backendUrl}\n`);

    const tests = [
        {
            name: 'Frontend - Main Page',
            url: config.frontendUrl,
            expectStatus: 200,
            type: 'frontend'
        },
        {
            name: 'Frontend - API Documentation Page',
            url: `${config.frontendUrl}/api`,
            expectStatus: 200,
            type: 'frontend'
        },
        {
            name: 'Frontend - Website Orders Page',
            url: `${config.frontendUrl}/website-orders`,
            expectStatus: 200,
            type: 'frontend'
        },
        {
            name: 'Frontend - Login Page',
            url: `${config.frontendUrl}/login`,
            expectStatus: 200,
            type: 'frontend'
        },
        {
            name: 'Backend - Health Check',
            url: `${config.backendUrl}/`,
            expectStatus: 200,
            type: 'backend'
        },
        {
            name: 'Backend - Website Products API',
            url: `${config.backendUrl}/api/website/products`,
            expectStatus: 200,
            type: 'backend'
        },
        {
            name: 'Backend - Website Categories API',
            url: `${config.backendUrl}/api/website/categories`,
            expectStatus: 200,
            type: 'backend'
        },
        {
            name: 'Backend - Orders API (Auth Required)',
            url: `${config.backendUrl}/api/website/orders`,
            expectStatus: 401,
            type: 'backend'
        }
    ];

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            
            const response = await makeRequest(test.url);
            const success = response.statusCode === test.expectStatus;
            
            if (success) {
                console.log(`✅ PASS - ${test.name} (${response.statusCode})`);
                passed++;
            } else {
                console.log(`❌ FAIL - ${test.name} (Expected: ${test.expectStatus}, Got: ${response.statusCode})`);
                failed++;
            }
            
            // Show additional info for successful responses
            if (response.statusCode === 200) {
                if (test.type === 'frontend') {
                    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                        console.log(`   ✓ HTML page loaded successfully`);
                    }
                } else if (test.type === 'backend') {
                    if (response.data && typeof response.data === 'object') {
                        if (response.data.success !== undefined) {
                            console.log(`   ✓ API Response: ${response.data.success ? 'Success' : 'Failed'}`);
                            if (response.data.data && Array.isArray(response.data.data)) {
                                console.log(`   ✓ Records: ${response.data.data.length}`);
                            }
                        } else if (response.data.status) {
                            console.log(`   ✓ Status: ${response.data.status}`);
                        }
                    }
                }
            }
            
            results.push({
                test: test.name,
                url: test.url,
                expected: test.expectStatus,
                actual: response.statusCode,
                success: success,
                type: test.type
            });
            
        } catch (error) {
            console.log(`❌ ERROR - ${test.name}: ${error.message}`);
            failed++;
            results.push({
                test: test.name,
                url: test.url,
                expected: test.expectStatus,
                actual: 'ERROR',
                success: false,
                error: error.message,
                type: test.type
            });
        }
        
        console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 PRODUCTION DEPLOYMENT TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // Detailed results by type
    const frontendResults = results.filter(r => r.type === 'frontend');
    const backendResults = results.filter(r => r.type === 'backend');

    console.log('\n📱 FRONTEND TESTS:');
    frontendResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.test} - ${result.actual}`);
    });

    console.log('\n🔧 BACKEND TESTS:');
    backendResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.test} - ${result.actual}`);
    });

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Production deployment is successful!');
        console.log('\n🚀 Your enhanced API access system is now live:');
        console.log(`   • Frontend: ${config.frontendUrl}`);
        console.log(`   • API Docs: ${config.frontendUrl}/api`);
        console.log(`   • Orders: ${config.frontendUrl}/website-orders`);
        console.log(`   • Backend: ${config.backendUrl}`);
        console.log('\n✨ Features available:');
        console.log('   • Interactive API testing');
        console.log('   • Token generation and management');
        console.log('   • Complete order management system');
        console.log('   • Website integration APIs');
        console.log('   • Real-time order tracking');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the deployment.');
    }

    return failed === 0;
}

// Run the tests
testProductionDeployment()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });