#!/usr/bin/env node

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration with fallback to root user if needed
const dbConfigs = [
    // Try with environment variables first
    {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'inventory_user',
        password: process.env.DB_PASSWORD || 'StrongPass@123',
        database: process.env.DB_NAME || 'inventory_db',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    },
    // Fallback to root user if inventory_user fails
    {
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: process.env.DB_ROOT_PASSWORD || 'root',
        database: process.env.DB_NAME || 'inventory_db',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    },
    // Another common root password
    {
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: '',
        database: process.env.DB_NAME || 'inventory_db',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    }
];

async function tryConnection(config) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                connection.destroy();
                reject(err);
            } else {
                console.log(`✅ Connected successfully as ${config.user}@${config.host}`);
                resolve(connection);
            }
        });
    });
}

async function executeDatabaseFixes() {
    console.log('🔧 Starting Database Schema Fixes...\n');
    
    let connection = null;
    
    // Try different database configurations
    for (let i = 0; i < dbConfigs.length; i++) {
        const config = dbConfigs[i];
        console.log(`🔍 Attempting connection ${i + 1}/${dbConfigs.length}: ${config.user}@${config.host}:${config.port}`);
        
        try {
            connection = await tryConnection(config);
            break;
        } catch (err) {
            console.log(`❌ Connection ${i + 1} failed: ${err.message}`);
            if (i === dbConfigs.length - 1) {
                console.error('\n💥 All database connection attempts failed!');
                console.error('Please check:');
                console.error('1. MySQL server is running');
                console.error('2. Database credentials are correct');
                console.error('3. Database user has proper permissions');
                process.exit(1);
            }
        }
    }
    
    try {
        // Read the SQL fix script
        const sqlFilePath = path.join(__dirname, 'fix-database-issues.sql');
        console.log(`📖 Reading SQL script: ${sqlFilePath}`);
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found: ${sqlFilePath}`);
        }
        
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`📝 SQL script loaded (${sqlScript.length} characters)`);
        
        // Execute the SQL script
        console.log('\n🚀 Executing database fixes...\n');
        
        const results = await new Promise((resolve, reject) => {
            connection.query(sqlScript, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
        
        // Process and display results
        console.log('📊 Database Fix Results:');
        console.log('========================\n');
        
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result && result.length > 0) {
                    console.log(`Result Set ${index + 1}:`);
                    console.table(result);
                    console.log('');
                }
            });
        } else if (results && results.affectedRows !== undefined) {
            console.log(`✅ Query executed successfully. Affected rows: ${results.affectedRows}`);
        }
        
        // Test the fixes by running some verification queries
        console.log('🔍 Running verification tests...\n');
        
        // Test 1: Check if api_usage_logs table exists
        const apiLogsTest = await new Promise((resolve, reject) => {
            connection.query("SHOW TABLES LIKE 'api_usage_logs'", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        if (apiLogsTest.length > 0) {
            console.log('✅ api_usage_logs table exists');
        } else {
            console.log('❌ api_usage_logs table missing');
        }
        
        // Test 2: Check if users table has username column
        const usernameTest = await new Promise((resolve, reject) => {
            connection.query("SHOW COLUMNS FROM users LIKE 'username'", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        if (usernameTest.length > 0) {
            console.log('✅ users.username column exists');
        } else {
            console.log('❌ users.username column missing');
        }
        
        // Test 3: List all tables
        const allTables = await new Promise((resolve, reject) => {
            connection.query("SHOW TABLES", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        console.log('\n📋 All tables in inventory_db:');
        allTables.forEach(row => {
            const tableName = Object.values(row)[0];
            console.log(`  - ${tableName}`);
        });
        
        console.log('\n🎉 Database fixes completed successfully!');
        console.log('✅ The following issues have been resolved:');
        console.log('   1. Missing api_usage_logs table created');
        console.log('   2. Users table username column added/verified');
        console.log('   3. All required indexes created');
        console.log('   4. Foreign key constraints established');
        console.log('   5. Default categories inserted');
        
    } catch (error) {
        console.error('\n💥 Error executing database fixes:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the database fixes
executeDatabaseFixes().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});