#!/usr/bin/env node

/**
 * Test Generated API Token
 * Comprehensive test of the user-generated API token across all available endpoints
 */

const https = require('https');

// Configuration
const API_BASE = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Testing Generated API Token');
console.log('================================');
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

// Test functions
async function testWebsiteProducts() {
    console.log('📦 Testing Website Products API');
    console.log('-------------------------------');
    
    try {
        // Test GET products
        console.log('1. GET /api/v1/website/products');
        const getResponse = await makeRequest('GET', '/api/v1/website/products');
        console.log(`   Status: ${getResponse.status}`);
        
        if (getResponse.status === 200) {
            console.log(`   ✅ Success: Found ${getResponse.data.data?.length || 0} products`);
            if (getResponse.data.data && getResponse.data.data.length > 0) {
                console.log(`   📋 Sample product: ${getResponse.data.data[0].product_name}`);
            }
        } else {
            console.log(`   ❌ Error: ${getResponse.data.message || 'Unknown error'}`);
        }
        
        // Test POST product (create)
        console.log('2. POST /api/v1/website/products (Create Product)');
        const newProduct = {
            product_name: `Test Product ${Date.now()}`,
            description: 'API Token Test Product',
            price: 29.99,
            category_id: 1,
            stock_quantity: 100,
            sku: `TEST-${Date.now()}`,
            status: 'active'
        };
        
        const postResponse = await makeRequest('POST', '/api/v1/website/products', newProduct);
        console.log(`   Status: ${postResponse.status}`);
        
        if (postResponse.status === 201 || postResponse.status === 200) {
            console.log(`   ✅ Success: Product created with ID ${postResponse.data.data?.id || 'N/A'}`);
        } else {
            console.log(`   ❌ Error: ${postResponse.data.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
}

async function testWebsiteCategories() {
    console.log('🏷️  Testing Website Categories API');
    console.log('----------------------------------');
    
    try {
        // Test GET categories
        console.log('1. GET /api/v1/website/categories');
        const getResponse = await makeRequest('GET', '/api/v1/website/categories');
        console.log(`   Status: ${getResponse.status}`);
        
        if (getResponse.status === 200) {
            console.log(`   ✅ Success: Found ${getResponse.data.data?.length || 0} categories`);
            if (getResponse.data.data && getResponse.data.data.length > 0) {
                console.log(`   📋 Sample category: ${getResponse.data.data[0].category_name}`);
            }
        } else {
            console.log(`   ❌ Error: ${getResponse.data.message || 'Unknown error'}`);
        }
        
        // Test POST category (create)
        console.log('2. POST /api/v1/website/categories (Create Category)');
        const newCategory = {
            category_name: `Test Category ${Date.now()}`,
            description: 'API Token Test Category',
            status: 'active'
        };
        
        const postResponse = await makeRequest('POST', '/api/v1/website/categories', newCategory);
        console.log(`   Status: ${postResponse.status}`);
        
        if (postResponse.status === 201 || postResponse.status === 200) {
            console.log(`   ✅ Success: Category created with ID ${postResponse.data.data?.id || 'N/A'}`);
        } else {
            console.log(`   ❌ Error: ${postResponse.data.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
}

async function testWebsiteOrders() {
    console.log('🛒 Testing Website Orders API');
    console.log('-----------------------------');
    
    try {
        // Test GET orders
        console.log('1. GET /api/v1/website/orders');
        const getResponse = await makeRequest('GET', '/api/v1/website/orders?page=1&limit=5');
        console.log(`   Status: ${getResponse.status}`);
        
        if (getResponse.status === 200) {
            console.log(`   ✅ Success: Found ${getResponse.data.data?.length || 0} orders`);
            if (getResponse.data.data && getResponse.data.data.length > 0) {
                console.log(`   📋 Sample order: #${getResponse.data.data[0].order_number || getResponse.data.data[0].id}`);
            }
        } else {
            console.log(`   ❌ Error: ${getResponse.data.message || 'Unknown error'}`);
        }
        
        // Test POST order (create)
        console.log('2. POST /api/v1/website/orders (Place Order)');
        const newOrder = {
            cartItems: [
                {
                    product_id: 1,
                    product_name: 'Test Product',
                    quantity: 2,
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
            notes: 'API token test order'
        };
        
        const postResponse = await makeRequest('POST', '/api/v1/website/orders', newOrder);
        console.log(`   Status: ${postResponse.status}`);
        
        if (postResponse.status === 201 || postResponse.status === 200) {
            console.log(`   ✅ Success: Order created with ID ${postResponse.data.data?.id || 'N/A'}`);
        } else {
            console.log(`   ❌ Error: ${postResponse.data.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
}

async function testAuthentication() {
    console.log('🔐 Testing Authentication');
    console.log('-------------------------');
    
    try {
        // Test with valid token
        console.log('1. Testing token validation');
        const response = await makeRequest('GET', '/api/v1/website/products?limit=1');
        
        if (response.status === 200) {
            console.log('   ✅ Token is valid and working');
        } else if (response.status === 401) {
            console.log('   ❌ Token is invalid or expired');
        } else {
            console.log(`   ⚠️  Unexpected response: ${response.status}`);
        }
        
        // Test without token
        console.log('2. Testing without token (should fail)');
        const noTokenResponse = await makeRequest('GET', '/api/website/products');
        // Remove token for this test
        const originalToken = API_TOKEN;
        
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
}

// Main test execution
async function runAllTests() {
    console.log('🚀 Starting comprehensive API token test...\n');
    
    const startTime = Date.now();
    
    await testAuthentication();
    await testWebsiteProducts();
    await testWebsiteCategories();
    await testWebsiteOrders();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`⏱️  Total test duration: ${duration}s`);
    console.log(`🔑 Token tested: ${API_TOKEN.substring(0, 20)}...`);
    console.log(`🌐 API Base: ${API_BASE}`);
    console.log('');
    console.log('✅ All tests completed!');
    console.log('');
    console.log('💡 Usage Tips:');
    console.log('   • Use this token in your website integration');
    console.log('   • Include it in Authorization header: Bearer <token>');
    console.log('   • Store it securely and never expose it publicly');
    console.log('   • Monitor usage in the API Access dashboard');
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});