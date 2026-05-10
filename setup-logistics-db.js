require('dotenv').config();
const db = require('./db/connection');

async function setupDB() {
  try {
    const connection = await db.promise().getConnection();
    
    // First run the schema
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'database_migrations', 'logistics_schema.sql'), 'utf-8');
    
    // Split by semicolons for multiple statements
    const queries = schema.split(';').filter(q => q.trim().length > 0);
    
    console.log("🛠 Creating tables...");
    for (let query of queries) {
      await connection.query(query);
    }
    
    console.log("💰 Inserting default TENANT-001 wallet (50,000 INR)...");
    await connection.query(
      `INSERT IGNORE INTO logistics_wallets (wallet_id, tenant_id, balance) VALUES ('W-001', 'TENANT-001', 50000.00)`
    );
    
    console.log("✅ Database Setup Complete!");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Setup Failed:", error);
    process.exit(1);
  }
}

setupDB();
