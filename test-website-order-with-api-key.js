#!/usr/bin/env node

/**
 * Test Website Order with API Key
 * Test that website orders work with API key authentication
 */

const https = require('https');

// Configuration
const API_BASE = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Testing Website Order with API Key');
console.log('====================================');
console.log(`🔑 Token: ${API_TOKEN.substring(0, 20)}...`);
console.log('');

// Helper function to make API requests
function makeRequest(method, endpoint, data = null, useApiKey = true) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Website-Order-Test/1.0'
            },
            rejectUnauthorized: false
        };

        if (useApiKey) {
            options.headers['Authorization'] = `Bearer ${API_TOKEN}`;
            options.headers['X-API-Key'] = API_TOKEN;
        }

        if (data && (method === 'POST' || method === 'PUT')) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testWebsiteOrderAuth() {
    try {
        // Test 1: GET orders (should work)
        console.log('1. 📋 GET /api/website/orders (with API key)');
        const getOrders = await makeRequest('GET', '/api/website/orders');
        console.log(`   Status: ${getOrders.status} - ${getOrders.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (getOrders.status !== 200) {
            console.log(`   Error: ${getOrders.data.message || 'Unknown error'}`);
        }
        console.log('');

        // Test 2: POST order (main test)
        console.log('2. 🛒 POST /api/website/orders (with API key)');
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
            notes: 'API key authentication test order'
        };
        
        const postOrder = await makeRequest('POST', '/api/website/orders', orderData);
        console.log(`   Status: ${postOrder.status} - ${postOrder.status === 201 || postOrder.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (postOrder.status === 201 || postOrder.status === 200) {
            console.log(`   ✅ Order created successfully!`);
            console.log(`   Order ID: ${postOrder.data.data?.id || 'N/A'}`);
        } else {
            console.log(`   ❌ Error: ${postOrder.data.message || 'Unknown error'}`);
        }
        console.log('');

        // Test 3: POST without API key (should fail with 401)
        console.log('3. 🚫 POST /api/website/orders (without API key - should fail)');
        const postOrderNoAuth = await makeRequest('POST', '/api/website/orders', orderData, false);
        console.log(`   Status: ${postOrderNoAuth.status} - ${postOrderNoAuth.status === 401 ? '✅ CORRECTLY REJECTED' : '❌ UNEXPECTED'}`);
        console.log('');

        // Summary
        console.log('📊 Test Summary');
        console.log('===============');
        if (getOrders.status === 200 && (postOrder.status === 201 || postOrder.status === 200) && postOrderNoAuth.status === 401) {
            console.log('🎉 All tests passed! API key authentication is working correctly.');
            console.log('✅ Your website can now place orders using the API token.');
            console.log('');
            console.log('🔧 Frontend Integration:');
            console.log('   Add this header to your website requests:');
            console.log(`   Authorization: Bearer ${API_TOKEN}`);
            console.log('   OR');
            console.log(`   X-API-Key: ${API_TOKEN}`);
        } else {
            console.log('⚠️  Some tests failed. Check the results above.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testWebsiteOrderAuth().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});