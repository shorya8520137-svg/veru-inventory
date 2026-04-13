#!/usr/bin/env node

/**
 * Debug Order Authentication
 * Test the specific order endpoint with detailed logging
 */

const https = require('https');

const API_BASE = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🔍 Debug Order Authentication');
console.log('=============================');
console.log(`🔑 Token: ${API_TOKEN.substring(0, 20)}...`);
console.log('');

function makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Debug-Order-Auth/1.0',
                ...headers
            },
            rejectUnauthorized: false
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        console.log(`📤 ${method} ${endpoint}`);
        console.log(`📋 Headers:`, JSON.stringify(options.headers, null, 2));

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`📥 Response Status: ${res.statusCode}`);
                console.log(`📋 Response Headers:`, JSON.stringify(res.headers, null, 2));
                
                try {
                    const parsedData = JSON.parse(responseData);
                    console.log(`📄 Response Body:`, JSON.stringify(parsedData, null, 2));
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    console.log(`📄 Response Body (raw):`, responseData);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request Error:`, error.message);
            reject(error);
        });

        if (data && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function debugOrderAuth() {
    console.log('🧪 Test 1: GET /api/website/orders (should work)');
    console.log('================================================');
    
    try {
        const getResult = await makeRequest('GET', '/api/website/orders', null, {
            'Authorization': `Bearer ${API_TOKEN}`,
            'X-API-Key': API_TOKEN
        });
        
        console.log(`✅ GET Result: ${getResult.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
        console.log(`❌ GET Failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🧪 Test 2: POST /api/website/orders (main test)');
    console.log('===============================================');
    
    const orderData = {
        cartItems: [
            {
                product_id: 1,
                product_name: 'Debug Test Product',
                quantity: 1,
                price: 1.00
            }
        ],
        shippingAddress: {
            name: 'Debug Test Customer',
            phone: '+1234567890',
            addressLine1: '123 Debug Street',
            city: 'Debug City',
            state: 'Debug State',
            postalCode: '12345',
            country: 'Debug Country'
        },
        billingAddress: {
            name: 'Debug Test Customer',
            phone: '+1234567890',
            addressLine1: '123 Debug Street',
            city: 'Debug City',
            state: 'Debug State',
            postalCode: '12345',
            country: 'Debug Country'
        },
        paymentMethod: 'credit_card',
        notes: 'Debug authentication test'
    };
    
    try {
        const postResult = await makeRequest('POST', '/api/website/orders', orderData, {
            'Authorization': `Bearer ${API_TOKEN}`,
            'X-API-Key': API_TOKEN
        });
        
        console.log(`✅ POST Result: ${postResult.status === 201 || postResult.status === 200 ? 'SUCCESS' : 'FAILED'}`);
        
        if (postResult.status === 401) {
            console.log('\n🔍 AUTHENTICATION ISSUE DETECTED');
            console.log('================================');
            console.log('The server is rejecting the API key for POST requests.');
            console.log('This suggests the middleware is not properly handling API key auth for orders.');
        }
        
    } catch (error) {
        console.log(`❌ POST Failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🧪 Test 3: Alternative header formats');
    console.log('=====================================');
    
    // Test with only Authorization header
    console.log('3.1 Testing with only Authorization header');
    try {
        const authOnlyResult = await makeRequest('POST', '/api/website/orders', orderData, {
            'Authorization': `Bearer ${API_TOKEN}`
        });
        console.log(`    Authorization only: ${authOnlyResult.status}`);
    } catch (error) {
        console.log(`    Authorization only failed: ${error.message}`);
    }
    
    // Test with only X-API-Key header
    console.log('3.2 Testing with only X-API-Key header');
    try {
        const apiKeyOnlyResult = await makeRequest('POST', '/api/website/orders', orderData, {
            'X-API-Key': API_TOKEN
        });
        console.log(`    X-API-Key only: ${apiKeyOnlyResult.status}`);
    } catch (error) {
        console.log(`    X-API-Key only failed: ${error.message}`);
    }
    
    console.log('\n📊 Debug Summary');
    console.log('================');
    console.log('If all tests show 401 errors, the API key authentication');
    console.log('middleware needs to be fixed or the server needs to be restarted.');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Check server logs for authentication debug messages');
    console.log('2. Verify the API key exists in the database');
    console.log('3. Ensure the middleware is properly applied');
}

debugOrderAuth().catch(error => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
});