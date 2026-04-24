const mysql = require('mysql2');
require('dotenv').config();

// Simple database connection (no pooling for better compatibility)
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'StrongPass@123',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

console.log('🔧 Database Configuration (Simple Connection):');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

// Create simple connection (not pool)
const connection = mysql.createConnection(dbConfig);

// Test connection
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - check if database server is running');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied - check username and password');
        } else if (err.code === 'ENOTFOUND') {
            console.error('💡 Host not found - check database host address');
        }
    } else {
        console.log('✅ Database connected successfully (Simple Connection)');
    }
});

// Handle connection errors
connection.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed. Reconnecting...');
        connection.connect();
    }
});

module.exports = connection;
