#!/usr/bin/env node

const db = require('./db/connection');

function testDatabaseTables() {
    console.log('🔍 Checking if website product tables exist...');

    // Check if website_categories table exists
    db.query("SHOW TABLES LIKE 'website_categories'", (err, results) => {
        if (err) {
            console.error('❌ Database connection error:', err.message);
            return;
        }

        if (results.length > 0) {
            console.log('✅ website_categories table exists');
            
            // Check table structure
            db.query("DESCRIBE website_categories", (err, structure) => {
                if (err) {
                    console.error('❌ Error describing website_categories:', err.message);
                } else {
                    console.log('📋 website_categories structure:');
                    console.table(structure);
                }
            });
        } else {
            console.log('❌ website_categories table does NOT exist');
        }
    });

    // Check if website_products table exists
    db.query("SHOW TABLES LIKE 'website_products'", (err, results) => {
        if (err) {
            console.error('❌ Database connection error:', err.message);
            return;
        }

        if (results.length > 0) {
            console.log('✅ website_products table exists');
            
            // Check table structure
            db.query("DESCRIBE website_products", (err, structure) => {
                if (err) {
                    console.error('❌ Error describing website_products:', err.message);
                } else {
                    console.log('📋 website_products structure:');
                    console.table(structure);
                }
            });
        } else {
            console.log('❌ website_products table does NOT exist');
        }
    });

    // List all tables to see what exists
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            console.error('❌ Error listing tables:', err.message);
        } else {
            console.log('\n📊 All existing tables:');
            results.forEach(row => {
                const tableName = Object.values(row)[0];
                console.log(`  - ${tableName}`);
            });
        }
        
        // Close connection
        setTimeout(() => {
            db.end();
            console.log('\n✅ Database connection closed');
        }, 1000);
    });
}

testDatabaseTables();