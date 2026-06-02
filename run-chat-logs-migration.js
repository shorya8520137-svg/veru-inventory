/**
 * Run the inventorygpt_chat_logs table migration.
 * Usage: node run-chat-logs-migration.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'api.insora.in',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'StrongPass@123',
    database: process.env.DB_NAME || 'inventory_db',
  });

  console.log('Connected. Creating inventorygpt_chat_logs table...');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS inventorygpt_chat_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      session_id VARCHAR(64) NOT NULL,
      user_question TEXT NOT NULL,
      bot_response TEXT NOT NULL,
      model VARCHAR(64) DEFAULT NULL,
      intent_type VARCHAR(64) DEFAULT NULL,
      render_type VARCHAR(32) DEFAULT NULL,
      response_time_ms INT DEFAULT NULL,
      user_email VARCHAR(255) DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_chat_logs_session (session_id),
      KEY idx_chat_logs_created (created_at),
      KEY idx_chat_logs_user (user_email),
      KEY idx_chat_logs_intent (intent_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ inventorygpt_chat_logs table ready');
  await connection.end();
}

run().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
