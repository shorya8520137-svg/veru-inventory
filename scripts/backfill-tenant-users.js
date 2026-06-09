const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'StrongPass@123',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
});

const DEFAULT_PASSWORD = 'Client@123';

db.query(`SELECT id, company_name, admin_email FROM clients ORDER BY id`, (err, clients) => {
    if (err) { console.error(err); process.exit(1); }

    let idx = 0;

    function next() {
        if (idx >= clients.length) {
            console.log('\nDone. Existing clients now have login access.');
            db.end();
            return;
        }

        const c = clients[idx++];
        const slug = c.company_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

        // Check tenant
        db.query('SELECT id FROM tenants WHERE slug = ?', [slug], (err2, tenants) => {
            if (err2) { console.error(err2); return next(); }

            const createTenant = (cb) => {
                if (tenants.length > 0) return cb(null, tenants[0].id);
                db.query('INSERT INTO tenants (slug, name, is_active) VALUES (?, ?, 1)', [slug, c.company_name], (err3, r) => {
                    cb(err3, r ? r.insertId : null);
                });
            };

            createTenant((err3, tenantId) => {
                if (err3 || !tenantId) { console.error('Tenant error:', err3); return next(); }

                // Check user
                db.query('SELECT id FROM users WHERE email = ?', [c.admin_email], (err4, users) => {
                    if (err4) { console.error(err4); return next(); }
                    if (users.length > 0) {
                        console.log(`✓ User already exists for ${c.admin_email} (${c.company_name})`);
                        return next();
                    }

                    // Get role
                    db.query('SELECT id FROM roles ORDER BY id ASC LIMIT 1', (err5, roles) => {
                        const roleId = (roles && roles.length > 0) ? roles[0].id : 1;

                        bcrypt.hash(DEFAULT_PASSWORD, 10, (err6, hashedPassword) => {
                            if (err6) { console.error(err6); return next(); }

                            db.query(
                                `INSERT INTO users (name, email, password, role_id, tenant_id, is_active)
                                 VALUES (?, ?, ?, ?, ?, 1)`,
                                [`${c.company_name} Admin`, c.admin_email, hashedPassword, roleId, tenantId],
                                (err7) => {
                                    if (err7) {
                                        console.error(`✗ Failed for ${c.company_name}:`, err7.message);
                                    } else {
                                        console.log(`✅ ${c.company_name} (${c.admin_email}) → tenant=${tenantId}, password=${DEFAULT_PASSWORD}`);
                                    }
                                    next();
                                }
                            );
                        });
                    });
                });
            });
        });
    }

    next();
});
