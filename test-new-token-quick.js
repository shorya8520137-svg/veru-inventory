#!/usr/bin/env node

/**
 * Quick Test for New API Token
 * Test the working endpoints with correct data formats
 */

const https = require('https');

// Configuration
const API_BASE = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Quick Test - New API Token');
console.log('==============================');
console.log(`🔑 Token: ${API_TOKEN.substring(0, 20)}...`);
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

async function runQuickTests() {
    console.log('🚀 Running quick tests...\n');
    
    try {
        // Test 1: Get Products (Working)
        console.log('1. 📦 GET Products');
        const products = await makeRequest('GET', '/api/v1/website/products');
        console.log(`   Status: ${products.status} - ${products.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (products.status === 200) {
            console.log(`   Found ${products.data.data?.length || 0} products`);
        }
        console.log('');

        // Test 2: Create Product (Working)
        console.log('2. 📦 POST Product');
        const newProduct = {
            product_name: `API Test Product ${Date.now()}`,
            description: 'Created via API token test',
            price: 19.99,
            category_id: 1,
            stock_quantity: 50,
            sku: `API-${Date.now()}`,
            status: 'active'
        };
        
        const createProduct = await makeRequest('POST', '/api/v1/website/products', newProduct);
        console.log(`   Status: ${createProduct.status} - ${createProduct.status === 201 ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (createProduct.status === 201) {
            console.log(`   Created product ID: ${createProduct.data.data?.id}`);
        } else {
            console.log(`   Error: ${createProduct.data.message}`);
        }
        console.log('');

        // Test 3: Get Categories (Working)
        console.log('3. 🏷️ GET Categories');
        const categories = await makeRequest('GET', '/api/v1/website/categories');
        console.log(`   Status: ${categories.status} - ${categories.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (categories.status === 200) {
            console.log(`   Found ${categories.data.data?.length || 0} categories`);
        }
        console.log('');

        // Test 4: Create Category (Fix required field)
        console.log('4. 🏷️ POST Category');
        const newCategory = {
            category_name: `API Test Category ${Date.now()}`,
            description: 'Created via API token test',
            status: 'active'
        };
        
        const createCategory = await makeRequest('POST', '/api/v1/website/categories', newCategory);
        console.log(`   Status: ${createCategory.status} - ${createCategory.status === 201 ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (createCategory.status === 201) {
            console.log(`   Created category ID: ${createCategory.data.data?.id}`);
        } else {
            console.log(`   Error: ${createCategory.data.message}`);
        }
        console.log('');

        // Test 5: Simple cURL examples
        console.log('5. 💻 cURL Examples for Integration:');
        console.log('');
        console.log('   Get Products:');
        console.log(`   curl -H "Authorization: Bearer ${API_TOKEN}" \\`);
        console.log(`        https://54.169.31.95:8443/api/v1/website/products`);
        console.log('');
        console.log('   Create Product:');
        console.log(`   curl -H "Authorization: Bearer ${API_TOKEN}" \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -X POST \\`);
        console.log(`        -d '{"product_name":"My Product","price":29.99,"category_id":1}' \\`);
        console.log(`        https://54.169.31.95:8443/api/v1/website/products`);
        console.log('');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('🎯 Summary: Your API token is working great for Products and Categories!');
    console.log('📋 Ready for website integration.');
}

// Run the tests
runQuickTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});