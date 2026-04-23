const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupBillingSystem() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Read and execute migration file
        const migrationPath = path.join(__dirname, 'migrations', 'create-billing-tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`\n📝 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    await connection.execute(statement);
                    
                    // Extract table/action info for better logging
                    if (statement.includes('CREATE TABLE')) {
                        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
                        console.log(`✅ Created table: ${tableName}`);
                    } else if (statement.includes('INSERT INTO')) {
                        const tableName = statement.match(/INSERT INTO `?(\w+)`?/i)?.[1];
                        console.log(`✅ Inserted sample data into: ${tableName}`);
                    } else {
                        console.log(`✅ Executed statement ${i + 1}`);
                    }
                } catch (err) {
                    console.error(`❌ Error executing statement ${i + 1}:`, err.message);
                }
            }
        }

        console.log('\n✅ Billing system setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - bills table created');
        console.log('   - store_inventory table created');
        console.log('   - store_inventory_logs table created');
        console.log('   - Sample inventory data inserted');
        console.log('\n🚀 You can now access the billing system at /billing');

    } catch (error) {
        console.error('❌ Error setting up billing system:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

setupBillingSystem();
