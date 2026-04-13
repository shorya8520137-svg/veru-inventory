#!/usr/bin/env node

/**
 * Generate New API Token and Test All Endpoints
 * Complete workflow: Generate token -> Test all APIs -> Report results
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const API_BASE = 'https://54.169.31.95:8443';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🚀 Generate and Test API Token');
console.log('===============================');
console.log(`🌐 API Base: ${API_BASE}`);
console.log('');

// Helper function to make API requests
function makeRequest(method, endpoint, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'API-Token-Generator-Test/1.0'
            },
            rejectUnauthorized: false
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            options.headers['X-API-Key'] = token;
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

// Generate API key (same format as server)
function generateApiKey() {
    const prefix = 'wk_live_';
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('hex');
    return prefix + key;
}

// Step 1: Get JWT token for API key creation
async function getJWTToken() {
    console.log('🔐 Step 1: Getting JWT token for API key creation...');
    
    try {
        const loginData = {
            email: 'admin@example.com', // You may need to adjust this
            password: 'admin123' // You may need to adjust this
        };
        
        const response = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (response.status === 200 && response.data.token) {
            console.log('✅ JWT token obtained successfully');
            return response.data.token;
        } else {
            console.log('❌ Failed to get JWT token');
            console.log('   Status:', response.status);
            console.log('   Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Error getting JWT token:', error.message);
        return null;
    }
}

// Step 2: Create API key using JWT
async function createApiKey(jwtToken) {
    console.log('\n🔑 Step 2: Creating new API key...');
    
    try {
        const keyData = {
            name: `Test API Key ${Date.now()}`,
            description: 'Generated for comprehensive API testing'
        };
        
        const response = await makeRequest('POST', '/api/api-keys', keyData, jwtToken);
        
        if (response.status === 201 && response.data.success) {
            const apiKey = response.data.data.api_key || response.data.data.key;
            console.log('✅ API key created successfully');
            console.log(`🔑 New API Key: ${apiKey}`);
            return apiKey;
        } else {
            console.log('❌ Failed to create API key');
            console.log('   Status:', response.status);
            console.log('   Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Error creating API key:', error.message);
        return null;
    }
}

// Step 3: Test all API endpoints
async function testAllEndpoints(apiToken) {
    console.log('\n🧪 Step 3: Testing all API endpoints...');
    console.log('==========================================');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Products API
    console.log('\n📦 Testing Products API');
    console.log('-----------------------');
    
    try {
        // GET products
        console.log('1. GET /api/v1/website/products');
        const getProducts = await makeRequest('GET', '/api/v1/website/products', null, apiToken);
        const productsSuccess = getProducts.status === 200;
        console.log(`   Status: ${getProducts.status} - ${productsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (productsSuccess) {
            console.log(`   Found ${getProducts.data.data?.length || 0} products`);
            results.passed++;
        } else {
            console.log(`   Error: ${getProducts.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Products', status: productsSuccess });
        
        // POST product
        console.log('2. POST /api/v1/website/products');
        const newProduct = {
            product_name: `Test Product ${Date.now()}`,
            description: 'Generated by API test script',
            price: 29.99,
            category_id: 1,
            stock_quantity: 100,
            sku: `TEST-${Date.now()}`,
            status: 'active'
        };
        
        const postProduct = await makeRequest('POST', '/api/v1/website/products', newProduct, apiToken);
        const productCreateSuccess = postProduct.status === 201;
        console.log(`   Status: ${postProduct.status} - ${productCreateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (productCreateSuccess) {
            console.log(`   Created product ID: ${postProduct.data.data?.id}`);
            results.passed++;
        } else {
            console.log(`   Error: ${postProduct.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'POST Product', status: productCreateSuccess });
        
    } catch (error) {
        console.log(`   ❌ Products API test failed: ${error.message}`);
        results.failed += 2;
        results.tests.push({ name: 'GET Products', status: false });
        results.tests.push({ name: 'POST Product', status: false });
    }
    
    // Test 2: Categories API
    console.log('\n🏷️ Testing Categories API');
    console.log('-------------------------');
    
    try {
        // GET categories
        console.log('1. GET /api/v1/website/categories');
        const getCategories = await makeRequest('GET', '/api/v1/website/categories', null, apiToken);
        const categoriesSuccess = getCategories.status === 200;
        console.log(`   Status: ${getCategories.status} - ${categoriesSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (categoriesSuccess) {
            console.log(`   Found ${getCategories.data.data?.length || 0} categories`);
            results.passed++;
        } else {
            console.log(`   Error: ${getCategories.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Categories', status: categoriesSuccess });
        
        // POST category
        console.log('2. POST /api/v1/website/categories');
        const newCategory = {
            category_name: `Test Category ${Date.now()}`,
            description: 'Generated by API test script',
            status: 'active'
        };
        
        const postCategory = await makeRequest('POST', '/api/v1/website/categories', newCategory, apiToken);
        const categoryCreateSuccess = postCategory.status === 201;
        console.log(`   Status: ${postCategory.status} - ${categoryCreateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (categoryCreateSuccess) {
            console.log(`   Created category ID: ${postCategory.data.data?.id}`);
            results.passed++;
        } else {
            console.log(`   Error: ${postCategory.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'POST Category', status: categoryCreateSuccess });
        
    } catch (error) {
        console.log(`   ❌ Categories API test failed: ${error.message}`);
        results.failed += 2;
        results.tests.push({ name: 'GET Categories', status: false });
        results.tests.push({ name: 'POST Category', status: false });
    }
    
    // Test 3: Website Orders API (both endpoints)
    console.log('\n🛒 Testing Website Orders API');
    console.log('-----------------------------');
    
    try {
        // Test v1 endpoint
        console.log('1. GET /api/v1/website/orders');
        const getOrdersV1 = await makeRequest('GET', '/api/v1/website/orders', null, apiToken);
        const ordersV1Success = getOrdersV1.status === 200;
        console.log(`   Status: ${getOrdersV1.status} - ${ordersV1Success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (ordersV1Success) {
            console.log(`   Found ${getOrdersV1.data.data?.length || 0} orders (v1 endpoint)`);
            results.passed++;
        } else {
            console.log(`   Error: ${getOrdersV1.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Orders (v1)', status: ordersV1Success });
        
        // Test website endpoint
        console.log('2. GET /api/website/orders');
        const getOrdersWebsite = await makeRequest('GET', '/api/website/orders', null, apiToken);
        const ordersWebsiteSuccess = getOrdersWebsite.status === 200;
        console.log(`   Status: ${getOrdersWebsite.status} - ${ordersWebsiteSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (ordersWebsiteSuccess) {
            console.log(`   Found ${getOrdersWebsite.data.data?.length || 0} orders (website endpoint)`);
            results.passed++;
        } else {
            console.log(`   Error: ${getOrdersWebsite.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'GET Orders (website)', status: ordersWebsiteSuccess });
        
        // Test POST order
        console.log('3. POST /api/website/orders');
        const orderData = {
            cartItems: [
                {
                    product_id: 1,
                    product_name: 'Test Product',
                    quantity: 1,
                    price: 29.99
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
            notes: 'Generated by API test script'
        };
        
        const postOrder = await makeRequest('POST', '/api/website/orders', orderData, apiToken);
        const orderCreateSuccess = postOrder.status === 201 || postOrder.status === 200;
        console.log(`   Status: ${postOrder.status} - ${orderCreateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (orderCreateSuccess) {
            console.log(`   Created order ID: ${postOrder.data.data?.id}`);
            results.passed++;
        } else {
            console.log(`   Error: ${postOrder.data.message || 'Unknown error'}`);
            results.failed++;
        }
        results.tests.push({ name: 'POST Order', status: orderCreateSuccess });
        
    } catch (error) {
        console.log(`   ❌ Orders API test failed: ${error.message}`);
        results.failed += 3;
        results.tests.push({ name: 'GET Orders (v1)', status: false });
        results.tests.push({ name: 'GET Orders (website)', status: false });
        results.tests.push({ name: 'POST Order', status: false });
    }
    
    return results;
}

// Main execution
async function main() {
    try {
        // Step 1: Get JWT token
        const jwtToken = await getJWTToken();
        if (!jwtToken) {
            console.log('\n❌ Cannot proceed without JWT token');
            console.log('💡 Please ensure:');
            console.log('   1. Server is running');
            console.log('   2. Admin user exists with correct credentials');
            console.log('   3. Database is properly set up');
            return;
        }
        
        // Step 2: Create API key
        const apiToken = await createApiKey(jwtToken);
        if (!apiToken) {
            console.log('\n❌ Cannot proceed without API token');
            return;
        }
        
        // Step 3: Test all endpoints
        const results = await testAllEndpoints(apiToken);
        
        // Final summary
        console.log('\n📊 FINAL TEST RESULTS');
        console.log('=====================');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
        
        console.log('\n📋 Detailed Results:');
        results.tests.forEach(test => {
            console.log(`   ${test.status ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log('\n🔑 Your New API Token:');
        console.log('======================');
        console.log(apiToken);
        
        console.log('\n💻 Usage Examples:');
        console.log('==================');
        console.log('curl -H "Authorization: Bearer ' + apiToken + '" \\');
        console.log('     https://54.169.31.95:8443/api/v1/website/products');
        console.log('');
        console.log('curl -H "X-API-Key: ' + apiToken + '" \\');
        console.log('     https://54.169.31.95:8443/api/website/orders');
        
        if (results.passed > results.failed) {
            console.log('\n🎉 API system is working well! Most tests passed.');
        } else {
            console.log('\n⚠️  Some issues detected. Check the failed tests above.');
        }
        
    } catch (error) {
        console.error('\n💥 Script execution failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});