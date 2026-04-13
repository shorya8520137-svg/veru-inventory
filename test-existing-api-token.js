#!/usr/bin/env node

/**
 * Test Existing API Token
 * Comprehensive test of all API endpoints with existing token
 */

const https = require('https');

// Configuration - Use your existing token
const API_BASE = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Testing Existing API Token');
console.log('==============================');
console.log(`🔑 Token: ${API_TOKEN.substring(0, 20)}...`);
console.log(`🌐 API Base: ${API_BASE}`);
console.log('');

// Helper function to make API requests
function makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'X-API-Key': API_TOKEN,
                'User-Agent': 'API-Token-Test/1.0'
            },
            rejectUnauthorized: false
        };

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

async function runComprehensiveTests() {
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    console.log('🚀 Starting comprehensive API tests...\n');
    
    // Test 1: Authentication Validation
    console.log('🔐 Test 1: Authentication Validation');
    console.log('------------------------------------');
    try {
        const authTest = await makeRequest('GET', '/api/v1/website/products?limit=1');
        const authSuccess = authTest.status === 200;
        console.log(`Status: ${authTest.status} - ${authSuccess ? '✅ TOKEN VALID' : '❌ TOKEN INVALID'}`);
        if (authSuccess) {
            results.passed++;
        } else {
            results.failed++;
            console.log(`Error: ${authTest.data.message || 'Authentication failed'}`);
        }
        results.tests.push({ name: 'Token Authentication', status: authSuccess });
    } catch (error) {
        console.log(`❌ Authentication test failed: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'Token Authentication', status: false });
    }
    
    console.log('');
    
    // Test 2: Products API (v1 endpoint)
    console.log('📦 Test 2: Products API (v1 endpoint)');
    console.log('-------------------------------------');
    
    try {
        // GET products
        console.log('2.1 GET /api/v1/website/products');
        const getProducts = await makeRequest('GET', '/api/v1/website/products');
        const productsSuccess = getProducts.status === 200;
        console.log(`    Status: ${getProducts.status} - ${productsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (productsSuccess) {
            console.log(`    Found ${getProducts.data.data?.length || 0} products`);
            results.passed++;
        } else {
            console.log(`    Error: ${getProducts.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Products (v1)', status: productsSuccess });
        
        // POST product
        console.log('2.2 POST /api/v1/website/products');
        const newProduct = {
            product_name: `API Test Product ${Date.now()}`,
            description: 'Created by comprehensive API test',
            price: 19.99,
            category_id: 1,
            stock_quantity: 50,
            sku: `API-${Date.now()}`,
            status: 'active'
        };
        
        const postProduct = await makeRequest('POST', '/api/v1/website/products', newProduct);
        const productCreateSuccess = postProduct.status === 201;
        console.log(`    Status: ${postProduct.status} - ${productCreateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (productCreateSuccess) {
            console.log(`    Created product ID: ${postProduct.data.data?.id}`);
            results.passed++;
        } else {
            console.log(`    Error: ${postProduct.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'POST Product (v1)', status: productCreateSuccess });
        
    } catch (error) {
        console.log(`    ❌ Products API test failed: ${error.message}`);
        results.failed += 2;
        results.tests.push({ name: 'GET Products (v1)', status: false });
        results.tests.push({ name: 'POST Product (v1)', status: false });
    }
    
    console.log('');
    
    // Test 3: Categories API (v1 endpoint)
    console.log('🏷️ Test 3: Categories API (v1 endpoint)');
    console.log('---------------------------------------');
    
    try {
        // GET categories
        console.log('3.1 GET /api/v1/website/categories');
        const getCategories = await makeRequest('GET', '/api/v1/website/categories');
        const categoriesSuccess = getCategories.status === 200;
        console.log(`    Status: ${getCategories.status} - ${categoriesSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (categoriesSuccess) {
            console.log(`    Found ${getCategories.data.data?.length || 0} categories`);
            results.passed++;
        } else {
            console.log(`    Error: ${getCategories.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Categories (v1)', status: categoriesSuccess });
        
    } catch (error) {
        console.log(`    ❌ Categories API test failed: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'GET Categories (v1)', status: false });
    }
    
    console.log('');
    
    // Test 4: Website Orders API (both endpoints)
    console.log('🛒 Test 4: Website Orders API');
    console.log('-----------------------------');
    
    try {
        // Test v1 endpoint
        console.log('4.1 GET /api/v1/website/orders');
        const getOrdersV1 = await makeRequest('GET', '/api/v1/website/orders');
        const ordersV1Success = getOrdersV1.status === 200;
        console.log(`    Status: ${getOrdersV1.status} - ${ordersV1Success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (ordersV1Success) {
            console.log(`    Found ${getOrdersV1.data.data?.length || 0} orders (v1 endpoint)`);
            results.passed++;
        } else {
            console.log(`    Error: ${getOrdersV1.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Orders (v1)', status: ordersV1Success });
        
        // Test website endpoint
        console.log('4.2 GET /api/website/orders');
        const getOrdersWebsite = await makeRequest('GET', '/api/website/orders');
        const ordersWebsiteSuccess = getOrdersWebsite.status === 200;
        console.log(`    Status: ${getOrdersWebsite.status} - ${ordersWebsiteSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (ordersWebsiteSuccess) {
            console.log(`    Found ${getOrdersWebsite.data.data?.length || 0} orders (website endpoint)`);
            results.passed++;
        } else {
            console.log(`    Error: ${getOrdersWebsite.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Orders (website)', status: ordersWebsiteSuccess });
        
        // Test POST order (the critical test for your website)
        console.log('4.3 POST /api/website/orders (CRITICAL TEST)');
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
                name: 'API Test Customer',
                phone: '+1234567890',
                addressLine1: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                postalCode: '12345',
                country: 'Test Country'
            },
            billingAddress: {
                name: 'API Test Customer',
                phone: '+1234567890',
                addressLine1: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                postalCode: '12345',
                country: 'Test Country'
            },
            paymentMethod: 'credit_card',
            notes: 'Comprehensive API test order'
        };
        
        const postOrder = await makeRequest('POST', '/api/website/orders', orderData);
        const orderCreateSuccess = postOrder.status === 201 || postOrder.status === 200;
        console.log(`    Status: ${postOrder.status} - ${orderCreateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (orderCreateSuccess) {
            console.log(`    ✅ ORDER CREATED! ID: ${postOrder.data.data?.id}`);
            console.log(`    🎉 Your website integration will work!`);
            results.passed++;
        } else {
            console.log(`    ❌ Error: ${postOrder.data.message || 'Unknown error'}`);
            console.log(`    ⚠️  Your website may have issues placing orders`);
            results.failed++;
        }
        results.tests.push({ name: 'POST Order (CRITICAL)', status: orderCreateSuccess });
        
    } catch (error) {
        console.log(`    ❌ Orders API test failed: ${error.message}`);
        results.failed += 3;
        results.tests.push({ name: 'GET Orders (v1)', status: false });
        results.tests.push({ name: 'GET Orders (website)', status: false });
        results.tests.push({ name: 'POST Order (CRITICAL)', status: false });
    }
    
    // Final Results
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    
    console.log('\n📋 Detailed Results:');
    results.tests.forEach(test => {
        const icon = test.status ? '✅' : '❌';
        const status = test.status ? 'PASS' : 'FAIL';
        console.log(`   ${icon} ${test.name}: ${status}`);
    });
    
    console.log('\n🔑 Your API Token:');
    console.log('==================');
    console.log(API_TOKEN);
    
    console.log('\n💻 Ready-to-Use Examples:');
    console.log('=========================');
    console.log('# Get products:');
    console.log(`curl -H "Authorization: Bearer ${API_TOKEN}" \\`);
    console.log('     https://54.169.31.95:8443/api/v1/website/products');
    console.log('');
    console.log('# Place order:');
    console.log(`curl -H "Authorization: Bearer ${API_TOKEN}" \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -X POST -d @order.json \\');
    console.log('     https://54.169.31.95:8443/api/website/orders');
    
    if (results.passed >= results.failed) {
        console.log('\n🎉 EXCELLENT! Your API system is working well!');
        console.log('✅ Most tests passed - ready for production use');
    } else {
        console.log('\n⚠️  ISSUES DETECTED');
        console.log('❌ Some tests failed - check the results above');
    }
    
    return results;
}

// Run the comprehensive tests
runComprehensiveTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});