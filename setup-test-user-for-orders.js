#!/usr/bin/env node

/**
 * Setup Test User for Order API Testing
 */

const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
    host: '127.0.0.1',
    user: 'inventory_user',
    password: 'StrongPass@123',
    database: 'inventory_db',
    port: 3306
};

async function setupTestUser() {
    const connection = mysql.createConnection(dbConfig);
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Check if test user already exists
        const checkUserQuery = 'SELECT id, username, email FROM users WHERE username = ? OR email = ?';
        const [existingUsers] = await connection.promise().execute(checkUserQuery, ['ordertest', 'ordertest@example.com']);
        
        if (existingUsers.length > 0) {
            console.log('✅ Test user already exists:');
            console.log('   Username:', existingUsers[0].username);
            console.log('   Email:', existingUsers[0].email);
            console.log('   ID:', existingUsers[0].id);
            
            // Update password to ensure it's correct
            const hashedPassword = await bcrypt.hash('testpass123', 10);
            const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
            await connection.promise().execute(updateQuery, [hashedPassword, 'ordertest']);
            console.log('✅ Password updated for test user');
            
        } else {
            console.log('👤 Creating new test user...');
            
            // Hash the password
            const hashedPassword = await bcrypt.hash('testpass123', 10);
            
            // Create test user
            const insertUserQuery = `
                INSERT INTO users (
                    id, username, email, password, first_name, last_name, 
                    role, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            const userId = `test_user_orders_${Date.now()}`;
            
            await connection.promise().execute(insertUserQuery, [
                userId,
                'ordertest',
                'ordertest@example.com',
                hashedPassword,
                'Order',
                'Tester',
                'user',
                1
            ]);
            
            console.log('✅ Test user created successfully:');
            console.log('   Username: ordertest');
            console.log('   Password: testpass123');
            console.log('   Email: ordertest@example.com');
            console.log('   ID:', userId);
        }
        
        // Check if test products exist
        console.log('\n📦 Checking test products...');
        const checkProductsQuery = 'SELECT id, product_name, stock_quantity FROM website_products WHERE id IN (?, ?)';
        const [products] = await connection.promise().execute(checkProductsQuery, ['test_product_001', 'test_product_002']);
        
        if (products.length < 2) {
            console.log('🛍️ Creating test products...');
            
            // Ensure category exists
            const categoryQuery = `
                INSERT IGNORE INTO website_categories (
                    id, name, slug, description, is_active, created_at, updated_at
                ) VALUES (1, 'Gifts', 'gifts', 'Test category for gifts', 1, NOW(), NOW())
            `;
            await connection.promise().execute(categoryQuery);
            
            // Create test products
            const productQueries = [
                {
                    id: 'test_product_001',
                    name: 'Custom Gift Box',
                    description: 'Beautiful customizable gift box perfect for any occasion',
                    price: 149.99,
                    sku: 'GIFT-BOX-001',
                    stock: 100
                },
                {
                    id: 'test_product_002',
                    name: 'Personalized Mug',
                    description: 'Custom printed mug with your personal message',
                    price: 24.99,
                    sku: 'MUG-CUSTOM-001',
                    stock: 50
                }
            ];
            
            for (const product of productQueries) {
                const insertProductQuery = `
                    INSERT IGNORE INTO website_products (
                        id, product_name, description, short_description, price, offer_price,
                        category_id, sku, stock_quantity, min_stock_level, weight, dimensions,
                        is_active, is_featured, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                
                await connection.promise().execute(insertProductQuery, [
                    product.id,
                    product.name,
                    product.description,
                    product.description.substring(0, 100),
                    product.price,
                    null, // offer_price
                    1, // category_id
                    product.sku,
                    product.stock,
                    5, // min_stock_level
                    '1.0', // weight
                    '10x10x5', // dimensions
                    1, // is_active
                    0, // is_featured
                ]);
            }
            
            console.log('✅ Test products created successfully');
        } else {
            console.log('✅ Test products already exist:');
            products.forEach(product => {
                console.log(`   - ${product.product_name} (Stock: ${product.stock_quantity})`);
            });
        }
        
        // Test authentication
        console.log('\n🔐 Testing authentication...');
        const testAuthQuery = 'SELECT id, username, password FROM users WHERE username = ?';
        const [authUsers] = await connection.promise().execute(testAuthQuery, ['ordertest']);
        
        if (authUsers.length > 0) {
            const user = authUsers[0];
            const passwordMatch = await bcrypt.compare('testpass123', user.password);
            
            if (passwordMatch) {
                console.log('✅ Authentication test passed');
            } else {
                console.log('❌ Authentication test failed - password mismatch');
            }
        } else {
            console.log('❌ Authentication test failed - user not found');
        }
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\nTest credentials:');
        console.log('  Username: ordertest');
        console.log('  Password: testpass123');
        console.log('  Email: ordertest@example.com');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        connection.end();
    }
}

// Run setup
setupTestUser().catch(console.error);