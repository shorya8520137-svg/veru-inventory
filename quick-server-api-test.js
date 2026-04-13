#!/usr/bin/env node

// Quick API test for server deployment
const axios = require('axios');

const BASE_URL = 'http://localhost:8443';

async function quickTest() {
    console.log('🚀 Quick Server API Test');
    console.log('========================');
    
    try {
        // Test 1: Server health
        console.log('1️⃣ Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/api/test`, { timeout: 5000 });
        console.log('✅ Server is running');
        
        // Test 2: Categories endpoint (public)
        console.log('2️⃣ Testing categories endpoint...');
        const categoriesResponse = await axios.get(`${BASE_URL}/api/website/categories`, { timeout: 5000 });
        console.log('✅ Categories endpoint working');
        console.log(`   Response: ${categoriesResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Categories found: ${categoriesResponse.data.data?.length || 0}`);
        
        // Test 3: Products endpoint (public)
        console.log('3️⃣ Testing products endpoint...');
        const productsResponse = await axios.get(`${BASE_URL}/api/website/products`, { timeout: 5000 });
        console.log('✅ Products endpoint working');
        console.log(`   Response: ${productsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Products found: ${productsResponse.data.data?.length || 0}`);
        
        // Test 4: Authentication
        console.log('4️⃣ Testing authentication...');
        const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@company.com',
            password: 'Admin@123'
        }, { timeout: 5000 });
        
        if (authResponse.data.success && authResponse.data.token) {
            console.log('✅ Authentication working');
            console.log(`   Token received: ${authResponse.data.token.substring(0, 20)}...`);
        } else {
            console.log('❌ Authentication failed');
        }
        
        console.log('\n🎉 All tests passed! API is working correctly.');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running');
            console.log('💡 Start server with: node server.js');
        } else if (error.response) {
            console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else {
            console.log(`❌ Network Error: ${error.message}`);
        }
        process.exit(1);
    }
}

quickTest();