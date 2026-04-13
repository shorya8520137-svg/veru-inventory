const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_system',
    multipleStatements: true
};

async function setupWarehouseOrderActivity() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        
        console.log('✅ Connected to database successfully');
        
        // Read and execute the schema file
        console.log('📄 Reading schema file...');
        const schemaPath = path.join(__dirname, 'warehouse-order-activity-schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        console.log('🔄 Creating warehouse_order_activity table...');
        await connection.execute(schema);
        
        console.log('✅ Warehouse Order Activity table created successfully!');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'signatures');
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
            console.log('✅ Uploads directory created successfully!');
        } catch (dirError) {
            if (dirError.code !== 'EEXIST') {
                console.error('❌ Error creating uploads directory:', dirError.message);
            } else {
                console.log('✅ Uploads directory already exists');
            }
        }
        
        // Test the table
        console.log('🔄 Testing table structure...');
        const [rows] = await connection.execute('DESCRIBE warehouse_order_activity');
        console.log('📋 Table structure:');
        console.table(rows);
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Restart your server to load the new routes');
        console.log('2. Test the Order Activity form in the OrderSheet');
        console.log('3. Check that file uploads work correctly');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Check your database credentials in .env file');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database does not exist. Create it first or check DB_NAME in .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Cannot connect to database. Make sure MySQL is running');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupWarehouseOrderActivity();