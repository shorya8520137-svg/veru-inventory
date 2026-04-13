#!/usr/bin/env node

/**
 * Debug API Calls - Check what's happening with the API
 */

const https = require('https');

function testAPI(endpoint, description) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing: ${description}`);
        console.log(`   Endpoint: https://54.169.31.95:8443${endpoint}`);
        
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: endpoint,
            method: 'GET',
            rejectUnauthorized: false,
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    console.log(`   Response: ${JSON.stringify(parsed, null, 4)}`);
                } catch (e) {
                    console.log(`   Raw Response: ${data}`);
                }
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (err) => {
            console.log(`   Error: ${err.message}`);
            resolve({ error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`   Error: Request timeout`);
            resolve({ error: 'Timeout' });
        });

        req.end();
    });
}

async function debugAPICalls() {
    console.log('🔍 Debug API Calls - Website Products');
    console.log('=====================================');
    console.log('Checking what the server is actually returning...\n');

    // Test the exact endpoints the frontend is calling
    await testAPI('/api/website/categories', 'Categories (Frontend calls this)');
    await testAPI('/api/website/products', 'Products (Frontend calls this)');
    await testAPI('/api/website/products/featured', 'Featured Products');
    
    // Test authentication endpoint
    console.log('\n🔐 Testing Authentication...');
    const authOptions = {
        hostname: '54.169.31.95',
        port: 8443,
        path: '/api/auth/login',
        method: 'POST',
        rejectUnauthorized: false,
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const authData = JSON.stringify({
        email: 'admin@company.com',
        password: 'Admin@123'
    });

    const authResult = await new Promise((resolve) => {
        const req = https.request(authOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Auth Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.token) {
                        console.log(`   Token: ${parsed.token.substring(0, 30)}...`);
                        resolve({ token: parsed.token, status: res.statusCode });
                    } else {
                        console.log(`   Auth Response: ${JSON.stringify(parsed, null, 4)}`);
                        resolve({ status: res.statusCode, data: parsed });
                    }
                } catch (e) {
                    console.log(`   Auth Raw: ${data}`);
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (err) => {
            console.log(`   Auth Error: ${err.message}`);
            resolve({ error: err.message });
        });

        req.write(authData);
        req.end();
    });

    // If we got a token, test protected endpoints
    if (authResult.token) {
        console.log('\n🔒 Testing with Authentication Token...');
        
        const protectedOptions = {
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/categories',
            method: 'GET',
            rejectUnauthorized: false,
            timeout: 5000,
            headers: {
                'Authorization': `Bearer ${authResult.token}`,
                'Content-Type': 'application/json'
            }
        };

        await new Promise((resolve) => {
            const req = https.request(protectedOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`   Protected Status: ${res.statusCode}`);
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`   Protected Response: ${JSON.stringify(parsed, null, 4)}`);
                    } catch (e) {
                        console.log(`   Protected Raw: ${data}`);
                    }
                    resolve();
                });
            });

            req.on('error', (err) => {
                console.log(`   Protected Error: ${err.message}`);
                resolve();
            });

            req.end();
        });
    }

    console.log('\n📋 Summary & Next Steps');
    console.log('=======================');
    console.log('Based on the results above:');
    console.log('');
    console.log('If you see "Access token required" for public endpoints:');
    console.log('  → The server needs to be restarted with the updated code');
    console.log('  → SSH to server and restart: pkill -f "node.*server.js" && npm run server');
    console.log('');
    console.log('If you see database errors:');
    console.log('  → Run the database setup script on the server');
    console.log('  → SSH and run: ./fix-website-products-backend.sh');
    console.log('');
    console.log('If authentication fails:');
    console.log('  → Check database user permissions');
    console.log('  → Verify MySQL is running');
    console.log('');
    console.log('🌐 After fixing, test frontend at:');
    console.log('   https://inventoryfullstack-one.vercel.app/website-products');
}

debugAPICalls().catch(console.error);