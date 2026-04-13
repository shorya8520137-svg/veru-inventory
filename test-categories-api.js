const fetch = require('node-fetch');

const API_BASE = 'https://54.169.31.95:8443';

// Use built-in fetch for Node 18+
async function testCategoriesAPI() {
    try {
        console.log('🔍 Testing Categories API...');
        
        // Test public categories endpoint (no auth required)
        console.log('1. Testing public categories endpoint...');
        const categoriesResponse = await fetch(`${API_BASE}/api/website/categories`);
        
        console.log('Categories response status:', categoriesResponse.status);
        
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            console.log('✅ Categories API working!');
            console.log('Categories found:', categoriesData.data?.length || 0);
            
            if (categoriesData.data && categoriesData.data.length > 0) {
                console.log('Sample category:', categoriesData.data[0]);
            } else {
                console.log('ℹ️ No categories found - database might be empty');
            }
        } else {
            console.error('❌ Categories API failed:', categoriesResponse.status);
            const errorData = await categoriesResponse.text();
            console.error('Error:', errorData);
        }

        // Test public products endpoint
        console.log('\n2. Testing public products endpoint...');
        const productsResponse = await fetch(`${API_BASE}/api/website/products`);
        
        console.log('Products response status:', productsResponse.status);
        
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            console.log('✅ Products API working!');
            console.log('Products found:', productsData.data?.length || 0);
            
            if (productsData.data && productsData.data.length > 0) {
                console.log('Sample product:', productsData.data[0]);
            } else {
                console.log('ℹ️ No products found - database might be empty');
            }
        } else {
            console.error('❌ Products API failed:', productsResponse.status);
            const errorData = await productsResponse.text();
            console.error('Error:', errorData);
        }

        // Test products with category filter
        console.log('\n3. Testing products with category filter...');
        const filteredResponse = await fetch(`${API_BASE}/api/website/products?category=tumbler`);
        
        if (filteredResponse.ok) {
            const filteredData = await filteredResponse.json();
            console.log('✅ Category filter working!');
            console.log('Filtered products found:', filteredData.data?.length || 0);
        } else {
            console.error('❌ Category filter failed:', filteredResponse.status);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCategoriesAPI();