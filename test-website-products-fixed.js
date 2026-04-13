#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8443';
const TEST_USER = {
    email: 'admin@company.com',
    password: 'Admin@123'
};

let authToken = '';

// Test functions
async function login() {
    try {
        console.log('🔐 Testing login...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
        
        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ Login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetCategories() {
    try {
        console.log('\n📂 Testing GET /api/website/categories...');
        const response = await axios.get(`${BASE_URL}/api/website/categories`);
        
        console.log('✅ Categories fetched successfully');
        console.log(`   Found ${response.data.data?.length || 0} categories`);
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Categories error:', error.response?.data?.message || error.message);
        console.log('   Status:', error.response?.status);
        return false;
    }
}

async function testGetProducts() {
    try {
        console.log('\n📦 Testing GET /api/website/products...');
        const response = await axios.get(`${BASE_URL}/api/website/products`);
        
        console.log('✅ Products fetched successfully');
        console.log(`   Found ${response.data.data?.length || 0} products`);
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Products error:', error.response?.data?.message || error.message);
        console.log('   Status:', error.response?.status);
        return false;
    }
}

async function testCreateCategory() {
    try {
        console.log('\n➕ Testing POST /api/website/categories...');
        const categoryData = {
            name: 'Test Category',
            description: 'A test category for API testing',
            slug: 'test-category'
        };

        const response = await axios.post(`${BASE_URL}/api/website/categories`, categoryData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Category created successfully');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return response.data.data?.id;
    } catch (error) {
        console.log('❌ Create category error:', error.response?.data?.message || error.message);
        console.log('   Status:', error.response?.status);
        return null;
    }
}

async function testCreateProduct(categoryId) {
    try {
        console.log('\n➕ Testing POST /api/website/products...');
        const productData = {
            product_name: 'Test Product',
            description: 'A test product for API testing',
            short_description: 'Test product',
            price: 99.99,
            offer_price: 79.99,
            category_id: categoryId,
            sku: 'TEST-001',
            stock_quantity: 100,
            is_active: true,
            is_featured: false
        };

        const response = await axios.post(`${BASE_URL}/api/website/products`, productData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Product created successfully');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return response.data.data?.id;
    } catch (error) {
        console.log('❌ Create product error:', error.response?.data?.message || error.message);
        console.log('   Status:', error.response?.status);
        return null;
    }
}

async function testServerConnection() {
    try {
        console.log('🔍 Testing server connection...');
        const response = await axios.get(`${BASE_URL}/api/test`, { timeout: 5000 });
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running or not accessible');
        } else {
            console.log('❌ Server connection error:', error.message);
        }
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Website Products API Tests');
    console.log('=====================================');

    // Test server connection first
    const serverRunning = await testServerConnection();
    if (!serverRunning) {
        console.log('\n❌ Cannot proceed - server is not running');
        console.log('💡 Please start the server first: node server.js');
        process.exit(1);
    }

    // Test authentication
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without authentication');
        process.exit(1);
    }

    // Test public endpoints (no auth required)
    await testGetCategories();
    await testGetProducts();

    // Test authenticated endpoints
    const categoryId = await testCreateCategory();
    if (categoryId) {
        await testCreateProduct(categoryId);
    }

    console.log('\n🎉 API tests completed!');
    console.log('=====================================');
}

// Run the tests
runTests().catch(error => {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
});