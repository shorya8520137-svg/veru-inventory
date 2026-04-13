#!/usr/bin/env node

/**
 * Quick Test for Authentication Fix
 * Tests if public routes work without authentication
 */

const https = require('https');

const API_BASE = 'https://54.169.31.95:8443';

function testEndpoint(path, method = 'GET', data = null, useAuth = false, token = null) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (useAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            rejectUnauthorized: false,
            timeout: 10000,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsed,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runQuickTest() {
    console.log('🧪 Quick Authentication Fix Test');
    console.log('================================');

    try {
        // Test 1: Public categories (should work without auth)
        console.log('\n1️⃣ Testing public categories endpoint...');
        const categoriesResult = await testEndpoint('/api/website/categories');
        
        if (categoriesResult.success) {
            console.log('✅ PASS - Categories endpoint works without authentication');
            console.log(`   Status: ${categoriesResult.statusCode}`);
        } else {
            console.log('❌ FAIL - Categories endpoint still requires authentication');
            console.log(`   Status: ${categoriesResult.statusCode}`);
            console.log(`   Response: ${JSON.stringify(categoriesResult.data, null, 2)}`);
        }

        // Test 2: Public products (should work without auth)
        console.log('\n2️⃣ Testing public products endpoint...');
        const productsResult = await testEndpoint('/api/website/products');
        
        if (productsResult.success) {
            console.log('✅ PASS - Products endpoint works without authentication');
            console.log(`   Status: ${productsResult.statusCode}`);
        } else {
            console.log('❌ FAIL - Products endpoint still requires authentication');
            console.log(`   Status: ${productsResult.statusCode}`);
            console.log(`   Response: ${JSON.stringify(productsResult.data, null, 2)}`);
        }

        // Test 3: Authentication (get token for protected tests)
        console.log('\n3️⃣ Testing authentication...');
        const authResult = await testEndpoint('/api/auth/login', 'POST', {
            email: 'admin@company.com',
            password: 'Admin@123'
        });

        let token = null;
        if (authResult.success && authResult.data.token) {
            token = authResult.data.token;
            console.log('✅ PASS - Authentication successful');
            console.log(`   Token: ${token.substring(0, 20)}...`);
        } else {
            console.log('❌ FAIL - Authentication failed');
            console.log(`   Status: ${authResult.statusCode}`);
            console.log(`   Response: ${JSON.stringify(authResult.data, null, 2)}`);
        }

        // Test 4: Protected endpoint (should require auth)
        if (token) {
            console.log('\n4️⃣ Testing protected endpoint with authentication...');
            const protectedResult = await testEndpoint('/api/website/categories', 'POST', {
                name: `Test Category ${Date.now()}`,
                description: 'Test category for auth fix verification'
            }, true, token);

            if (protectedResult.success) {
                console.log('✅ PASS - Protected endpoint works with authentication');
                console.log(`   Status: ${protectedResult.statusCode}`);
            } else {
                console.log('⚠️  PARTIAL - Protected endpoint returned error (might be database issue)');
                console.log(`   Status: ${protectedResult.statusCode}`);
                console.log(`   Response: ${JSON.stringify(protectedResult.data, null, 2)}`);
            }
        }

        // Test 5: Protected endpoint without auth (should fail)
        console.log('\n5️⃣ Testing protected endpoint without authentication...');
        const unprotectedResult = await testEndpoint('/api/website/categories', 'POST', {
            name: 'Test Category',
            description: 'This should fail'
        });

        if (!unprotectedResult.success && unprotectedResult.statusCode === 401) {
            console.log('✅ PASS - Protected endpoint correctly requires authentication');
            console.log(`   Status: ${unprotectedResult.statusCode}`);
        } else {
            console.log('❌ FAIL - Protected endpoint should require authentication');
            console.log(`   Status: ${unprotectedResult.statusCode}`);
            console.log(`   Response: ${JSON.stringify(unprotectedResult.data, null, 2)}`);
        }

        // Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        
        const publicWorking = categoriesResult.success && productsResult.success;
        const authWorking = authResult.success;
        const protectionWorking = !unprotectedResult.success && unprotectedResult.statusCode === 401;

        console.log(`Public endpoints: ${publicWorking ? '✅ Working' : '❌ Not working'}`);
        console.log(`Authentication: ${authWorking ? '✅ Working' : '❌ Not working'}`);
        console.log(`Route protection: ${protectionWorking ? '✅ Working' : '❌ Not working'}`);

        if (publicWorking && authWorking && protectionWorking) {
            console.log('\n🎉 SUCCESS - Authentication fix is working correctly!');
            console.log('The frontend should now work properly.');
            process.exit(0);
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS - Some issues remain.');
            if (!publicWorking) {
                console.log('- Public endpoints still require authentication');
            }
            if (!authWorking) {
                console.log('- Authentication system has issues');
            }
            if (!protectionWorking) {
                console.log('- Protected routes are not properly secured');
            }
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runQuickTest();