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

let queryCounter = 0;

function logPool(sql) {
    const ctx = als.getStore();
    const dbName = ctx?.clientDb || 'main';
    const short = sql?.substring(0, 60).replace(/\n/g, ' ');
    queryCounter++;
    if (queryCounter <= 15 || ctx?.clientDb) {
        console.log(`💾 [${queryCounter}] DB: ${dbName} | ${short}`);
    }
}

// Context-aware DB wrapper — routes queries to the correct pool per request
const db = {
    query: (...args) => {
        const pool = getActivePool();
        const sql = typeof args[0] === 'string' ? args[0] : '';
        logPool(sql);
        const last = args[args.length - 1];
        if (typeof last === 'function') {
            const cb = last;
            const queryArgs = args.slice(0, -1);
            pool.query(...queryArgs, (err, results, fields) => {
                cb(err, results, fields);
            });
        } else {
            pool.query(...args);
        }
    },
    execute: (...args) => {
        const pool = getActivePool();
        const sql = typeof args[0] === 'string' ? args[0] : '';
        logPool(sql);
        const last = args[args.length - 1];
        if (typeof last === 'function') {
            const cb = last;
            const queryArgs = args.slice(0, -1);
            pool.execute(...queryArgs, (err, results, fields) => {
                cb(err, results, fields);
            });
        } else {
            return pool.execute(...args);
        }
    },
    promise: () => {
        const pool = getActivePool();
        logPool('promise()');
        return pool.promise();
    },
    getConnection: (...args) => getActivePool().getConnection(...args),
    end: (...args) => getActivePool().end(...args),
};

// Middleware: set client DB context from authenticated user
function setClientDbContext(req, res, next) {
    const ctx = {};

    if (req.user) {
        if (req.user.client_db) {
            ctx.clientDb = req.user.client_db;
            console.log(`🔀 Client DB routing: ${ctx.clientDb} (from JWT)`);
        } else if (req.user.email) {
            // Fallback: check if this user is a client user (handles stale tokens without client_db)
            const pool = getActivePool();
            pool.query(
                'SELECT db_name FROM clients WHERE admin_email = ? AND status = "active" LIMIT 1',
                [req.user.email],
                (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        ctx.clientDb = rows[0].db_name;
                        console.log(`🔀 Client DB routing: ${ctx.clientDb} (fallback from email)`);
                        als.run(ctx, () => next());
                    } else {
                        console.log(`🔀 No client DB for ${req.user.email} — using main DB`);
                        als.run(ctx, () => next());
                    }
                }
            );
            return;
        } else {
            console.log(`🔀 User has no email or client_db — using main DB`);
        }
    } else {
        console.log(`🔀 No req.user — using main DB`);
    }

    als.run(ctx, () => next());
}

module.exports = db;
module.exports.setClientDbContext = setClientDbContext;
module.exports.als = als;
