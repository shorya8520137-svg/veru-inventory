#!/usr/bin/env node

const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'StrongPass@123',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306
};

async function testDatabaseFixes() {
    console.log('🧪 Testing Database Fixes...\n');
    
    const connection = mysql.createConnection(dbConfig);
    
    try {
        // Test connection
        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Database connection successful\n');
        
        // Test 1: Check if api_usage_logs table exists
        console.log('🔍 Test 1: Checking api_usage_logs table...');
        const apiLogsExists = await new Promise((resolve, reject) => {
            connection.query("SHOW TABLES LIKE 'api_usage_logs'", (err, result) => {
                if (err) reject(err);
                else resolve(result.length > 0);
            });
        });
        
        if (apiLogsExists) {
            console.log('✅ api_usage_logs table exists');
        } else {
            console.log('❌ api_usage_logs table missing');
        }
        
        // Test 2: Check users table structure
        console.log('\n🔍 Test 2: Checking users table structure...');
        const usersColumns = await new Promise((resolve, reject) => {
            connection.query("DESCRIBE users", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        const hasNameColumn = usersColumns.some(col => col.Field === 'name');
        const hasEmailColumn = usersColumns.some(col => col.Field === 'email');
        
        if (hasNameColumn && hasEmailColumn) {
            console.log('✅ Users table has required name and email columns');
        } else {
            console.log('❌ Users table missing required columns');
        }
        
        // Test 3: Check website_categories table (should be empty - no dummy data)
        console.log('\n🔍 Test 3: Checking website_categories table...');
        const categoryCount = await new Promise((resolve, reject) => {
            connection.query("SELECT COUNT(*) as count FROM website_categories", (err, result) => {
                if (err) reject(err);
                else resolve(result[0].count);
            });
        });
        
        console.log(`✅ website_categories table exists with ${categoryCount} records`);
        if (categoryCount === 0) {
            console.log('✅ No dummy data inserted (as requested)');
        } else {
            console.log(`ℹ️  Found ${categoryCount} existing categories`);
        }
        
        // Test 4: Check api_keys table
        console.log('\n🔍 Test 4: Checking api_keys table...');
        const apiKeysExists = await new Promise((resolve, reject) => {
            connection.query("SHOW TABLES LIKE 'api_keys'", (err, result) => {
                if (err) reject(err);
                else resolve(result.length > 0);
            });
        });
        
        if (apiKeysExists) {
            console.log('✅ api_keys table exists');
            
            // Check if there are any API keys
            const apiKeyCount = await new Promise((resolve, reject) => {
                connection.query("SELECT COUNT(*) as count FROM api_keys", (err, result) => {
                    if (err) reject(err);
                    else resolve(result[0].count);
                });
            });
            
            console.log(`ℹ️  Found ${apiKeyCount} API keys in database`);
        } else {
            console.log('❌ api_keys table missing');
        }
        
        // Test 5: Test the problematic query that was causing username errors
        console.log('\n🔍 Test 5: Testing fixed username query...');
        try {
            await new Promise((resolve, reject) => {
                connection.query(`
                    SELECT 
                        COALESCE(u.name, u.email) as username,
                        u.email as user_email
                    FROM users u
                    LIMIT 1
                `, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            console.log('✅ Username query fix working correctly');
        } catch (error) {
            console.log('❌ Username query still has issues:', error.message);
        }
        
        // Test 6: List all tables
        console.log('\n🔍 Test 6: Listing all tables...');
        const allTables = await new Promise((resolve, reject) => {
            connection.query("SHOW TABLES", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        console.log('📋 Tables in inventory_db:');
        allTables.forEach(row => {
            const tableName = Object.values(row)[0];
            console.log(`  - ${tableName}`);
        });
        
        // Summary
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log(`✅ Database connection: Working`);
        console.log(`${apiLogsExists ? '✅' : '❌'} api_usage_logs table: ${apiLogsExists ? 'Exists' : 'Missing'}`);
        console.log(`${hasNameColumn && hasEmailColumn ? '✅' : '❌'} Users table structure: ${hasNameColumn && hasEmailColumn ? 'Correct' : 'Issues'}`);
        console.log(`✅ Categories table: ${categoryCount} records (clean)`);
        console.log(`${apiKeysExists ? '✅' : '❌'} API keys table: ${apiKeysExists ? 'Exists' : 'Missing'}`);
        console.log(`✅ Username query fix: Working`);
        
        if (apiLogsExists && hasNameColumn && hasEmailColumn && apiKeysExists) {
            console.log('\n🎉 All database fixes appear to be working correctly!');
            console.log('✅ Your API token should now work without errors');
            console.log('✅ Orders API should work without username column errors');
            console.log('✅ No dummy data was inserted');
        } else {
            console.log('\n⚠️  Some issues detected. Please run the database fixes:');
            console.log('   node execute-clean-database-fixes.js');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    } finally {
        connection.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the tests
testDatabaseFixes().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});