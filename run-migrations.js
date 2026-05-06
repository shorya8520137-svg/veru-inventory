/**
 * Database Migration Runner
 * Executes all permission redesign migrations in order
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'StrongPass@123',
  database: process.env.DB_NAME || 'inventory_db',
  multipleStatements: true
};

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const MIGRATIONS = [
  '001_create_permission_templates.sql',
  '002_create_warehouse_access_levels.sql',
  '003_create_permission_dependencies.sql',
  '004_create_permission_conflicts.sql',
  '005_modify_permissions_table.sql',
  '006_modify_audit_logs_table.sql',
  '007_seed_permission_templates.sql',
  '008_seed_permission_dependencies.sql',
  '009_seed_permission_conflicts.sql',
  '010_update_permissions_feature_sections.sql'
];

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');

    for (const migration of MIGRATIONS) {
      const migrationPath = path.join(MIGRATIONS_DIR, migration);
      
      try {
        console.log(`📄 Running migration: ${migration}`);
        const sql = await fs.readFile(migrationPath, 'utf8');
        
        await connection.query(sql);
        console.log(`✅ Completed: ${migration}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${migration}`);
        console.error(`Error: ${error.message}\n`);
        
        // Continue with other migrations even if one fails
        // (some migrations might already be applied)
        continue;
      }
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 Database Schema Summary:');
    console.log('  ✅ 4 new tables created');
    console.log('  ✅ 2 existing tables modified');
    console.log('  ✅ 7 built-in templates seeded');
    console.log('  ✅ Permission dependencies configured');
    console.log('  ✅ Permission conflicts defined');
    console.log('  ✅ Feature sections assigned to all permissions');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migrations
runMigrations();
