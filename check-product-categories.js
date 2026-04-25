const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.production' });

async function checkProductCategories() {
    console.log('🔍 Checking Product Categories...\n');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // Check recent products and their categories
        console.log('📦 Recent Products:');
        console.log('='.repeat(80));
        const [products] = await connection.query(`
            SELECT 
                p.p_id,
                p.product_name,
                p.barcode,
                p.category_id,
                c.name AS category_name,
                c.display_name AS category_display_name,
                c.is_active AS category_is_active
            FROM dispatch_product p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        if (products.length === 0) {
            console.log('⚠️  No products found!');
        } else {
            products.forEach(p => {
                console.log(`\nProduct ID: ${p.p_id}`);
                console.log(`  Name: ${p.product_name}`);
                console.log(`  Barcode: ${p.barcode}`);
                console.log(`  Category ID: ${p.category_id || 'NULL'}`);
                console.log(`  Category Name: ${p.category_name || 'NONE'}`);
                console.log(`  Category Display: ${p.category_display_name || 'UNCATEGORIZED'}`);
                console.log(`  Category Active: ${p.category_is_active !== null ? p.category_is_active : 'N/A'}`);
            });
        }

        // Check all categories
        console.log('\n\n📂 All Categories:');
        console.log('='.repeat(80));
        const [categories] = await connection.query(`
            SELECT 
                id,
                name,
                display_name,
                description,
                is_active
            FROM product_categories
            ORDER BY name
        `);

        if (categories.length === 0) {
            console.log('⚠️  No categories found in database!');
            console.log('\n💡 Solution: Create categories from the Products page first');
        } else {
            categories.forEach(c => {
                console.log(`\nCategory ID: ${c.id}`);
                console.log(`  Name: ${c.name}`);
                console.log(`  Display Name: ${c.display_name}`);
                console.log(`  Description: ${c.description || 'None'}`);
                console.log(`  Active: ${c.is_active}`);
            });
        }

        // Count products by category
        console.log('\n\n📊 Products by Category:');
        console.log('='.repeat(80));
        const [counts] = await connection.query(`
            SELECT 
                COALESCE(c.display_name, 'UNCATEGORIZED') AS category,
                COUNT(*) AS product_count
            FROM dispatch_product p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            GROUP BY c.display_name
            ORDER BY product_count DESC
        `);

        counts.forEach(row => {
            console.log(`  ${row.category}: ${row.product_count} products`);
        });

        await connection.end();

        console.log('\n\n✅ Check complete!');
        console.log('\n📋 Summary:');
        console.log(`  - Total categories: ${categories.length}`);
        console.log(`  - Total products: ${products.length}`);
        console.log(`  - Products without category: ${counts.find(c => c.category === 'UNCATEGORIZED')?.product_count || 0}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkProductCategories();
