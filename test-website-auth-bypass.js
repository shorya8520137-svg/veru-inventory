#!/usr/bin/env node

// Test website products API without authentication
const axios = require('axios');

const BASE_URL = 'https://54.169.31.95:8443';

async function testWebsiteAPI() {
    console.log('🧪 Testing Website Products API (No Auth)');
    console.log('==========================================');
    
    try {
        // Test 1: GET categories (should work)
        console.log('1️⃣ Testing GET categories...');
        const categoriesResponse = await axios.get(`${BASE_URL}/api/website/categories`, {
            timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
        console.log('✅ GET categories works');
        console.log(`   Found ${categoriesResponse.data.data?.length || 0} categories`);
        
        // Test 2: GET products (should work)
        console.log('2️⃣ Testing GET products...');
        const productsResponse = await axios.get(`${BASE_URL}/api/website/products`, {
            timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
        console.log('✅ GET products works');
        console.log(`   Found ${productsResponse.data.data?.length || 0} products`);
        
        // Test 3: POST category (should work after fix)
        console.log('3️⃣ Testing POST category (no auth)...');
        const categoryData = {
            name: 'Test Category API',
            description: 'Test category created via API',
            slug: 'test-category-api'
        };
        
        const createCategoryResponse = await axios.post(`${BASE_URL}/api/website/categories`, categoryData, {
            timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (createCategoryResponse.data.success) {
            console.log('✅ POST category works (no auth required)');
            console.log(`   Created category ID: ${createCategoryResponse.data.data.id}`);
            
            // Test 4: POST product (should work after fix)
            console.log('4️⃣ Testing POST product (no auth)...');
            const productData = {
                product_name: 'Test Product API',
                description: 'Test product created via API',
                short_description: 'Test product',
                price: 99.99,
                offer_price: 79.99,
                category_id: createCategoryResponse.data.data.id,
                sku: 'TEST-API-001',
                stock_quantity: 50,
                is_active: true,
                is_featured: false
            };
            
            const createProductResponse = await axios.post(`${BASE_URL}/api/website/products`, productData, {
                timeout: 10000,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (createProductResponse.data.success) {
                console.log('✅ POST product works (no auth required)');
                console.log(`   Created product ID: ${createProductResponse.data.data.id}`);
            } else {
                console.log('❌ POST product failed:', createProductResponse.data.message);
            }
        } else {
            console.log('❌ POST category failed:', createCategoryResponse.data.message);
        }
        
        console.log('\n🎉 Website API tests completed!');
        
    } catch (error) {
        if (error.response) {
            console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 401) {
                console.log('\n💡 SOLUTION: The server still requires authentication.');
                console.log('   Please ensure the server has pulled the latest changes:');
                console.log('   1. git pull origin main');
                console.log('   2. pm2 restart all');
                console.log('   3. Check server logs for auth middleware messages');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running or not accessible');
        } else {
            console.log(`❌ Network Error: ${error.message}`);
        }
        process.exit(1);
    }
}

testWebsiteAPI();