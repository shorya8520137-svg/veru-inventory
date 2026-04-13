#!/usr/bin/env node

const https = require('https');

let authToken = null;

function makeRequest(path, method = 'GET', data = null, useAuth = true) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (useAuth && authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
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
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
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

async function authenticate() {
    console.log('🔐 Authenticating...');
    const response = await makeRequest('/api/auth/login', 'POST', {
        email: 'admin@company.com',
        password: 'Admin@123'
    }, false);

    if (response.statusCode === 200 && response.data.token) {
        authToken = response.data.token;
        console.log('✅ Authentication successful');
        return true;
    } else {
        console.log('❌ Authentication failed:', response.data);
        return false;
    }
}

async function testWebsiteAPI() {
    console.log('\n🧪 Testing Website Products API (Authenticated)');
    console.log('================================================');

    try {
        // Test 1: Get categories with auth
        console.log('\n1️⃣ GET /api/website/categories (with auth)');
        const categoriesResponse = await makeRequest('/api/website/categories');
        console.log(`Status: ${categoriesResponse.statusCode}`);
        console.log('Response:', JSON.stringify(categoriesResponse.data, null, 2));

        // Test 2: Get products with auth
        console.log('\n2️⃣ GET /api/website/products (with auth)');
        const productsResponse = await makeRequest('/api/website/products');
        console.log(`Status: ${productsResponse.statusCode}`);
        console.log('Response:', JSON.stringify(productsResponse.data, null, 2));

        // Test 3: Create category
        console.log('\n3️⃣ POST /api/website/categories');
        const createCategoryResponse = await makeRequest('/api/website/categories', 'POST', {
            name: `Test Category ${Date.now()}`,
            description: 'Test category created by API test',
            sort_order: 1
        });
        console.log(`Status: ${createCategoryResponse.statusCode}`);
        console.log('Response:', JSON.stringify(createCategoryResponse.data, null, 2));

        let categoryId = null;
        if (createCategoryResponse.statusCode === 201 && createCategoryResponse.data.data) {
            categoryId = createCategoryResponse.data.data.id;
            console.log(`✅ Category created with ID: ${categoryId}`);
        }

        // Test 4: Create product
        console.log('\n4️⃣ POST /api/website/products');
        const createProductResponse = await makeRequest('/api/website/products', 'POST', {
            product_name: `Test Product ${Date.now()}`,
            description: 'Test product created by API test',
            short_description: 'Short description',
            price: 29.99,
            offer_price: 24.99,
            category_id: categoryId || 1,
            stock_quantity: 100,
            min_stock_level: 10,
            is_active: true,
            is_featured: false
        });
        console.log(`Status: ${createProductResponse.statusCode}`);
        console.log('Response:', JSON.stringify(createProductResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function runTests() {
    try {
        const authenticated = await authenticate();
        if (authenticated) {
            await testWebsiteAPI();
        }
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

runTests();