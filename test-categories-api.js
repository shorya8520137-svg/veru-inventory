const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.production' });

async function testCategoriesAPI() {
    console.log('🔍 Testing Categories API and Database...\n');

    // Test 1: Check database connection and categories table
    console.log('📊 Test 1: Checking database for categories...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Check if product_categories table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'product_categories'"
        );
        
        if (tables.length === 0) {
            console.log('❌ product_categories table does NOT exist!');
            await connection.end();
            return;
        }
        
        console.log('✅ product_categories table exists');

        // Get all categories
        const [categories] = await connection.query(
            'SELECT id, name, display_name, description, is_active FROM product_categories'
        );

        console.log(`\n📦 Total categories in database: ${categories.length}`);
        
        if (categories.length === 0) {
            console.log('⚠️  No categories found in database!');
            console.log('\n💡 Solution: Create categories from the Products page first');
        } else {
            console.log('\n✅ Categories found:');
            categories.forEach(cat => {
                console.log(`   - ${cat.name} (${cat.display_name}) [Active: ${cat.is_active}]`);
            });

            // Check active categories
            const activeCategories = categories.filter(c => c.is_active === 1);
            console.log(`\n✅ Active categories: ${activeCategories.length}`);
            
            if (activeCategories.length === 0) {
                console.log('⚠️  All categories are inactive!');
            }
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Database error:', error.message);
    }

    // Test 2: Test the API endpoint
    console.log('\n\n🌐 Test 2: Testing API endpoint...');
    console.log('API URL: ' + process.env.NEXT_PUBLIC_API_BASE + '/api/products/categories/all');
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        // You need to provide a valid token for this test
        console.log('\n⚠️  Note: This test requires a valid JWT token');
        console.log('To test the API:');
        console.log('1. Login to the frontend');
        console.log('2. Open browser console');
        console.log('3. Run: localStorage.getItem("token")');
        console.log('4. Copy the token and test with curl:\n');
        console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" ${process.env.NEXT_PUBLIC_API_BASE}/api/products/categories/all`);
        
    } catch (error) {
        console.error('❌ API test error:', error.message);
    }

    console.log('\n\n📋 Summary:');
    console.log('1. Check if categories exist in database');
    console.log('2. If no categories, create them from Products page');
    console.log('3. Verify categories are active (is_active = 1)');
    console.log('4. Test API endpoint with valid JWT token');
}

testCategoriesAPI();
