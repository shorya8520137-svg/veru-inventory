require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    multipleStatements: true
});

console.log('Setting up website orders database tables...');

const sql = fs.readFileSync('website-orders-schema.sql', 'utf8');

connection.query(sql, (error, results) => {
    if (error) {
        console.error('Error creating tables:', error);
    } else {
        console.log('✅ Website orders tables created successfully');
        console.log('Tables created:');
        console.log('- website_orders');
        console.log('- website_order_items');
    }
    connection.end();
});