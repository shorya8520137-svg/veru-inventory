const mysql = require('mysql2');
const { AsyncLocalStorage } = require('async_hooks');
require('dotenv').config();

const als = new AsyncLocalStorage();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'StrongPass@123',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('🔧 Database Configuration (Pool Connection):');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

const mainPool = mysql.createPool(dbConfig);

// Cache client DB pools
const clientPools = {};

// Test the main pool connection
mainPool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database pool connection failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - check if database server is running');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied - check username and password');
        } else if (err.code === 'ENOTFOUND') {
            console.error('💡 Host not found - check database host address');
        }
    } else {
        console.log('✅ Database connected successfully (Pool Connection)');
        connection.release();
    }
});

function getActivePool() {
    const ctx = als.getStore();
    if (ctx && ctx.clientDb) {
        if (!clientPools[ctx.clientDb]) {
            clientPools[ctx.clientDb] = mysql.createPool({
                ...dbConfig,
                database: ctx.clientDb,
            });
            console.log(`✅ Created connection pool for client DB: ${ctx.clientDb}`);
        }
        return clientPools[ctx.clientDb];
    }
    return mainPool;
}

// Context-aware DB wrapper — routes queries to the correct pool per request
const db = {
    query: (...args) => getActivePool().query(...args),
    execute: (...args) => getActivePool().execute(...args),
    promise: () => {
        const activePool = getActivePool();
        const pp = activePool.promise();
        return new Proxy(pp, {
            get(target, prop) {
                const val = target[prop];
                return typeof val === 'function' ? val.bind(target) : val;
            }
        });
    },
    getConnection: (...args) => getActivePool().getConnection(...args),
    end: (...args) => getActivePool().end(...args),
};

// Middleware: set client DB context from authenticated user
function setClientDbContext(req, res, next) {
    const ctx = {};
    if (req.user && req.user.client_db) {
        ctx.clientDb = req.user.client_db;
    }
    als.run(ctx, () => next());
}

module.exports = db;
module.exports.setClientDbContext = setClientDbContext;
module.exports.als = als;
