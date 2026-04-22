/**
 * TENANT MIDDLEWARE
 * Injects tenant_id into every authenticated request.
 * Strategy: Row-level tenancy — all queries filter by tenant_id.
 */

const db = require('../db/connection');

// Cache tenants in memory (refresh every 5 min)
let tenantCache = {};
let cacheTime   = 0;

async function loadTenants() {
    if (Date.now() - cacheTime < 300000) return; // 5 min cache
    return new Promise(resolve => {
        db.query('SELECT id, slug, is_active FROM tenants WHERE is_active = 1', (err, rows) => {
            if (!err && rows) {
                rows.forEach(t => { tenantCache[t.slug] = t.id; });
                cacheTime = Date.now();
            }
            resolve();
        });
    });
}

/**
 * Resolve tenant from:
 * 1. Subdomain: client1.yoursaas.com → slug = 'client1'
 * 2. Header: X-Tenant-ID
 * 3. JWT user.tenant_id
 * 4. Default: tenant_id = 1 (your own company)
 */
async function tenantMiddleware(req, res, next) {
    await loadTenants();

    let tenantId = 1; // default

    // Priority 1: From authenticated user's JWT
    if (req.user?.tenant_id) {
        tenantId = req.user.tenant_id;
    }
    // Priority 2: From X-Tenant-ID header (for API clients)
    else if (req.headers['x-tenant-id']) {
        tenantId = parseInt(req.headers['x-tenant-id']) || 1;
    }
    // Priority 3: From subdomain
    else {
        const host = req.hostname || '';
        const subdomain = host.split('.')[0];
        if (tenantCache[subdomain]) {
            tenantId = tenantCache[subdomain];
        }
    }

    req.tenantId = tenantId;
    next();
}

module.exports = tenantMiddleware;
