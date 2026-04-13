#!/usr/bin/env node

/**
 * Check Server Status and Test API
 * First check if server is running, then test API endpoints
 */

const https = require('https');
const http = require('http');

// Configuration
const REMOTE_API = 'https://54.169.31.95:8443';
const LOCAL_API = 'http://localhost:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

// Disable SSL verification
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🔍 Server Status Check and API Test');
console.log('===================================');
console.log('');

// Helper function to make requests
function makeRequest(baseUrl, endpoint, useHttps = true) {
    return new Promise((resolve, reject) => {
        const url = new URL(baseUrl + endpoint);
        const client = useHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'X-API-Key': API_TOKEN,
                'User-Agent': 'Server-Check/1.0'
            },
            timeout: 5000
        };

        if (useHttps) {
            options.rejectUnauthorized = false;
        }

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Request timeout' });
        });

        req.end();
    });
}

async function checkServerStatus() {
    console.log('🔍 Step 1: Checking server status...');
    console.log('');
    
    // Check remote server
    console.log('1.1 Remote Server (https://54.169.31.95:8443)');
    const remoteCheck = await makeRequest(REMOTE_API, '/api/v1/website/products?limit=1', true);
    
    if (remoteCheck.error) {
        console.log(`    ❌ Remote server: ${remoteCheck.error}`);
    } else {
        console.log(`    ✅ Remote server: Status ${remoteCheck.status}`);
        if (remoteCheck.status === 200) {
            console.log(`    🎉 Remote server is working with your API token!`);
            return { server: 'remote', baseUrl: REMOTE_API, working: true };
        }
    }
    
    // Check local server
    console.log('1.2 Local Server (http://localhost:8443)');
    const localCheck = await makeRequest(LOCAL_API, '/api/v1/website/products?limit=1', false);
    
    if (localCheck.error) {
        console.log(`    ❌ Local server: ${localCheck.error}`);
    } else {
        console.log(`    ✅ Local server: Status ${localCheck.status}`);
        if (localCheck.status === 200) {
            console.log(`    🎉 Local server is working with your API token!`);
            return { server: 'local', baseUrl: LOCAL_API, working: true };
        }
    }
    
    // Try alternative ports
    console.log('1.3 Alternative Ports');
    const altPorts = ['3000', '8000', '5000'];
    
    for (const port of altPorts) {
        const altUrl = `http://localhost:${port}`;
        console.log(`    Checking ${altUrl}...`);
        const altCheck = await makeRequest(altUrl, '/api/v1/website/products?limit=1', false);
        
        if (!altCheck.error && altCheck.status === 200) {
            console.log(`    ✅ Found working server on port ${port}!`);
            return { server: 'local', baseUrl: altUrl, working: true };
        }
    }
    
    return { working: false };
}

async function testApiEndpoints(baseUrl, useHttps) {
    console.log('\n🧪 Step 2: Testing API endpoints...');
    console.log(`Using: ${baseUrl}`);
    console.log('');
    
    const results = [];
    
    // Test endpoints
    const endpoints = [
        { name: 'Products (v1)', path: '/api/v1/website/products' },
        { name: 'Categories (v1)', path: '/api/v1/website/categories' },
        { name: 'Orders (v1)', path: '/api/v1/website/orders' },
        { name: 'Products (website)', path: '/api/website/products' },
        { name: 'Orders (website)', path: '/api/website/orders' }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint.name}...`);
        const result = await makeRequest(baseUrl, endpoint.path, useHttps);
        
        if (result.error) {
            console.log(`    ❌ ${endpoint.name}: ${result.error}`);
            results.push({ name: endpoint.name, status: 'error', error: result.error });
        } else {
            const success = result.status === 200;
            console.log(`    ${success ? '✅' : '❌'} ${endpoint.name}: Status ${result.status}`);
            if (success && result.data.data) {
                console.log(`        Found ${result.data.data.length || 0} items`);
            }
            results.push({ name: endpoint.name, status: result.status, success });
        }
    }
    
    return results;
}

async function testOrderCreation(baseUrl, useHttps) {
    console.log('\n🛒 Step 3: Testing order creation (CRITICAL)...');
    console.log('');
    
    const orderData = {
        cartItems: [
            {
                product_id: 1,
                product_name: 'Test Product',
                quantity: 1,
                price: 1.00
            }
        ],
        shippingAddress: {
            name: 'Test Customer',
            phone: '+1234567890',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'Test Country'
        },
        billingAddress: {
            name: 'Test Customer',
            phone: '+1234567890',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'Test Country'
        },
        paymentMethod: 'credit_card',
        notes: 'API test order'
    };
    
    return new Promise((resolve, reject) => {
        const url = new URL(baseUrl + '/api/website/orders');
        const client = useHttps ? https : http;
        const postData = JSON.stringify(orderData);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Order-Test/1.0'
            },
            timeout: 10000
        };

        if (useHttps) {
            options.rejectUnauthorized = false;
        }

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Request timeout' });
        });

        req.write(postData);
        req.end();
    }).then(result => {
        if (result.error) {
            console.log(`❌ Order creation failed: ${result.error}`);
            return false;
        } else {
            const success = result.status === 201 || result.status === 200;
            console.log(`${success ? '✅' : '❌'} Order creation: Status ${result.status}`);
            if (success) {
                console.log(`🎉 ORDER CREATED! Your website integration will work!`);
                console.log(`Order ID: ${result.data.data?.id || 'N/A'}`);
            } else {
                console.log(`Error: ${result.data.message || 'Unknown error'}`);
            }
            return success;
        }
    });
}

async function main() {
    try {
        // Step 1: Check server status
        const serverStatus = await checkServerStatus();
        
        if (!serverStatus.working) {
            console.log('\n❌ No working server found!');
            console.log('');
            console.log('💡 Troubleshooting:');
            console.log('   1. Make sure your Node.js server is running');
            console.log('   2. Check if it\'s running on the expected port');
            console.log('   3. Verify firewall settings');
            console.log('   4. Check server logs for errors');
            console.log('');
            console.log('🚀 To start your server:');
            console.log('   cd inventoryfullstack');
            console.log('   node server.js');
            return;
        }
        
        const useHttps = serverStatus.baseUrl.startsWith('https');
        
        // Step 2: Test API endpoints
        const apiResults = await testApiEndpoints(serverStatus.baseUrl, useHttps);
        
        // Step 3: Test order creation
        const orderSuccess = await testOrderCreation(serverStatus.baseUrl, useHttps);
        
        // Final summary
        console.log('\n📊 FINAL RESULTS');
        console.log('================');
        console.log(`🖥️  Server: ${serverStatus.server} (${serverStatus.baseUrl})`);
        console.log(`🔑 API Token: ${API_TOKEN.substring(0, 20)}...`);
        
        const successfulTests = apiResults.filter(r => r.success).length;
        const totalTests = apiResults.length;
        
        console.log(`📈 API Tests: ${successfulTests}/${totalTests} passed`);
        console.log(`🛒 Order Creation: ${orderSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        if (successfulTests > 0 && orderSuccess) {
            console.log('\n🎉 EXCELLENT! Your API system is working!');
            console.log('✅ Ready for website integration');
        } else if (successfulTests > 0) {
            console.log('\n⚠️  PARTIAL SUCCESS');
            console.log('✅ Some APIs working, but order creation needs attention');
        } else {
            console.log('\n❌ ISSUES DETECTED');
            console.log('⚠️  API system needs troubleshooting');
        }
        
        console.log('\n💻 Your API Token for Integration:');
        console.log('==================================');
        console.log(API_TOKEN);
        
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
    }
}

// Run the comprehensive check
main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});