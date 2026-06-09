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

function isMissingTable(err) {
    return err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE' || err.sqlMessage?.includes("doesn't exist"));
}

// Context-aware DB wrapper — routes queries to the correct pool per request
const db = {
    query: (...args) => {
        const pool = getActivePool();
        const last = args[args.length - 1];
        if (typeof last === 'function') {
            const cb = last;
            const queryArgs = args.slice(0, -1);
            pool.query(...queryArgs, (err, results, fields) => {
                if (isMissingTable(err)) return cb(null, []);
                cb(err, results, fields);
            });
        } else {
            pool.query(...args);
        }
    },
    execute: (...args) => {
        const pool = getActivePool();
        const last = args[args.length - 1];
        if (typeof last === 'function') {
            const cb = last;
            const queryArgs = args.slice(0, -1);
            pool.execute(...queryArgs, (err, results, fields) => {
                if (isMissingTable(err)) return cb(null, []);
                cb(err, results, fields);
            });
        } else {
            return pool.execute(...args).catch(err => {
                if (isMissingTable(err)) return [[]];
                throw err;
            });
        }
    },
    promise: () => {
        const activePool = getActivePool();
        const pp = activePool.promise();
        return new Proxy(pp, {
            get(target, prop) {
                const val = target[prop];
                if (typeof val !== 'function') return val;
                return (...args) => {
                    const result = val.apply(target, args);
                    if (result && typeof result.catch === 'function') {
                        return result.catch(err => {
                            if (isMissingTable(err)) return [[]];
                            throw err;
                        });
                    }
                    return result;
                };
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
