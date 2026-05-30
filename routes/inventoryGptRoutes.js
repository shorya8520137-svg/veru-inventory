const express = require('express');
const crypto = require('crypto');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = db.promise();

function generateInventoryGptToken() {
    return `igpt_${crypto.randomBytes(32).toString('hex')}`;
}

async function ensureTokenTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS inventorygpt_api_tokens (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            token VARCHAR(255) NOT NULL UNIQUE,
            token_prefix VARCHAR(20),
            is_active BOOLEAN DEFAULT 1,
            rate_limit INT DEFAULT 1000,
            usage_count INT DEFAULT 0,
            last_used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            INDEX idx_token (token),
            INDEX idx_user (user_id),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

function readInventoryGptToken(req) {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    return bearer || req.headers['x-inventorygpt-token'] || req.headers['x-api-key'] || '';
}

function numberOrNull(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

async function authenticateInventoryGptToken(req, res, next) {
    try {
        const token = readInventoryGptToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: 'InventoryGPT token required' });
        }

        await ensureTokenTable();
        const [rows] = await pool.execute(
            `SELECT id, user_id, rate_limit, usage_count
             FROM inventorygpt_api_tokens
             WHERE token = ? AND is_active = 1 AND expires_at > NOW()
             LIMIT 1`,
            [token]
        );

        if (!rows.length) {
            return res.status(403).json({ success: false, error: 'Invalid or expired InventoryGPT token' });
        }

        const tokenRow = rows[0];
        await pool.execute(
            'UPDATE inventorygpt_api_tokens SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [tokenRow.id]
        );

        req.inventoryGptToken = tokenRow;
        next();
    } catch (error) {
        console.error('InventoryGPT token auth error:', error);
        res.status(500).json({ success: false, error: 'Failed to authenticate InventoryGPT token' });
    }
}

router.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'InventoryGPT API',
        status: 'operational',
        endpoints: [
            'GET /api/inventorygpt/tokens',
            'POST /api/inventorygpt/tokens',
            'DELETE /api/inventorygpt/tokens/:tokenId',
            'GET /api/inventorygpt/inventory-state',
            'GET /api/inventorygpt/warehouse-metrics',
            'GET /api/inventorygpt/regional-demand',
            'GET /api/inventorygpt/recommendations',
            'POST /api/inventorygpt/recommendations',
            'PUT /api/inventorygpt/recommendations/:id/approve',
            'PUT /api/inventorygpt/recommendations/:id/reject',
            'GET /api/inventorygpt/store-intelligence'
        ]
    });
});

router.get('/tokens', authenticateToken, async (req, res) => {
    try {
        await ensureTokenTable();
        const [rows] = await pool.execute(
            `SELECT id, name, description, token_prefix, is_active, rate_limit, usage_count,
                    last_used_at, created_at, expires_at
             FROM inventorygpt_api_tokens
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error fetching InventoryGPT tokens:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/tokens', authenticateToken, async (req, res) => {
    try {
        const { name, description = null, rate_limit = 1000, expires_in_days = 90 } = req.body || {};
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, error: 'Token name is required' });
        }

        await ensureTokenTable();
        const token = generateInventoryGptToken();
        const tokenPrefix = token.slice(0, 13);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(expires_in_days || 90));

        const [result] = await pool.execute(
            `INSERT INTO inventorygpt_api_tokens
             (user_id, name, description, token, token_prefix, rate_limit, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                String(name).trim(),
                description ? String(description).trim() : null,
                token,
                tokenPrefix,
                Number(rate_limit || 1000),
                expiresAt
            ]
        );

        res.status(201).json({
            success: true,
            message: 'InventoryGPT token created successfully',
            id: result.insertId,
            token,
            tokenPrefix,
            expiresAt: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Error creating InventoryGPT token:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/tokens/:tokenId', authenticateToken, async (req, res) => {
    try {
        await ensureTokenTable();
        const [result] = await pool.execute(
            'UPDATE inventorygpt_api_tokens SET is_active = 0 WHERE id = ? AND user_id = ?',
            [req.params.tokenId, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ success: false, error: 'Token not found' });
        }

        res.json({ success: true, message: 'InventoryGPT token revoked successfully' });
    } catch (error) {
        console.error('Error revoking InventoryGPT token:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/inventory-state', authenticateInventoryGptToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                MIN(sb.id) AS id,
                sb.barcode AS sku,
                sb.product_name,
                sb.variant,
                sb.warehouse,
                COALESCE(dw.Warehouse_name, w.name, sb.warehouse) AS warehouse_name,
                SUM(sb.qty_available) AS stock,
                0 AS qty_reserved,
                SUM(sb.qty_available) AS sellable_stock,
                CASE
                    WHEN SUM(sb.qty_available) = 0 THEN 'DEAD_STOCK'
                    WHEN SUM(sb.qty_available) <= 5 THEN 'SLOW_MOVING'
                    ELSE 'ACTIVE'
                END AS stock_category,
                MAX(sb.created_at) AS last_verified_at,
                dp.price,
                dp.cost_price,
                sb.tenant_id,
                'stock_batches' AS source_table
            FROM stock_batches sb
            LEFT JOIN dispatch_product dp ON dp.barcode = sb.barcode
            LEFT JOIN dispatch_warehouse dw ON dw.warehouse_code = sb.warehouse
            LEFT JOIN warehouses w ON w.code = sb.warehouse OR w.name = sb.warehouse
            WHERE sb.status = 'active'
            GROUP BY sb.barcode, sb.product_name, sb.variant, sb.warehouse, dw.Warehouse_name,
                     w.name, dp.price, dp.cost_price, sb.tenant_id
            ORDER BY stock_category, stock DESC, sb.product_name
            LIMIT 1000
        `);

        res.json({ success: true, data: rows, count: rows.length, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching InventoryGPT inventory state:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/warehouse-metrics', authenticateInventoryGptToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                COALESCE(w.code, dw.warehouse_code, stock.warehouse) AS warehouse_id,
                COALESCE(w.name, dw.Warehouse_name, stock.warehouse) AS warehouse_name,
                COALESCE(w.city, '') AS city,
                COALESCE(w.state, '') AS state,
                COALESCE(w.capacity, 0) AS capacity,
                COALESCE(stock.total_skus, 0) AS total_skus,
                COALESCE(stock.total_stock, 0) AS total_stock,
                COALESCE(dispatches.total_dispatch, 0) AS total_dispatch,
                COALESCE(wpm.dead_stock_ratio, 0) AS dead_stock_ratio,
                COALESCE(wpm.fulfillment_speed, 0) AS fulfillment_speed,
                COALESCE(wpm.transfer_dependency, 0) AS transfer_dependency,
                COALESCE(wpm.storage_efficiency, 0) AS storage_efficiency,
                CASE
                    WHEN COALESCE(w.capacity, 0) > 0
                    THEN ROUND((COALESCE(stock.total_stock, 0) / w.capacity) * 100, 2)
                    ELSE NULL
                END AS storage_utilization_pct,
                CASE
                    WHEN COALESCE(wpm.dead_stock_ratio, 0) >= 50 THEN 'HIGH'
                    WHEN COALESCE(wpm.dead_stock_ratio, 0) >= 25 THEN 'MEDIUM'
                    ELSE 'LOW'
                END AS delay_risk_level,
                GREATEST(0, LEAST(100, 100 - COALESCE(wpm.dead_stock_ratio, 0))) AS health_score,
                COALESCE(wpm.created_at, NOW()) AS last_calculated
            FROM (
                SELECT warehouse, COUNT(DISTINCT barcode) AS total_skus, SUM(qty_available) AS total_stock
                FROM stock_batches
                WHERE status = 'active'
                GROUP BY warehouse
            ) stock
            LEFT JOIN warehouses w ON w.code = stock.warehouse OR w.name = stock.warehouse
            LEFT JOIN dispatch_warehouse dw ON dw.warehouse_code = stock.warehouse
            LEFT JOIN warehouse_performance_metrics wpm
                ON CAST(wpm.warehouse_id AS CHAR) IN (stock.warehouse, CAST(w.id AS CHAR), dw.warehouse_code)
            LEFT JOIN (
                SELECT warehouse, COUNT(*) AS total_dispatch
                FROM warehouse_dispatch
                GROUP BY warehouse
            ) dispatches ON dispatches.warehouse = stock.warehouse
            ORDER BY health_score DESC, total_stock DESC
        `);

        res.json({ success: true, data: rows, count: rows.length, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching InventoryGPT warehouse metrics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/regional-demand', authenticateInventoryGptToken, async (req, res) => {
    try {
        const { region, sku } = req.query;
        const filters = [];
        const params = [];

        if (region) {
            filters.push('rsa.region = ?');
            params.push(region);
        }

        if (sku) {
            filters.push('(CAST(rsa.sku_id AS CHAR) = ? OR dp.barcode = ? OR p.sku = ?)');
            params.push(sku, sku, sku);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const [rows] = await pool.execute(
            `
            SELECT
                rsa.id,
                DATE(rsa.created_at) AS analysis_date,
                rsa.region,
                rsa.warehouse_id,
                rsa.sku_id,
                COALESCE(dp.barcode, p.sku, CAST(rsa.sku_id AS CHAR)) AS sku,
                COALESCE(dp.product_name, p.product_name) AS product_name,
                rsa.marketplace,
                rsa.total_orders,
                rsa.total_revenue,
                rsa.avg_shipping_cost,
                CASE
                    WHEN TIMESTAMPDIFF(DAY, MIN(rsa.created_at) OVER (PARTITION BY rsa.sku_id, rsa.region), rsa.created_at) > 0
                    THEN ROUND(rsa.total_orders / TIMESTAMPDIFF(DAY, MIN(rsa.created_at) OVER (PARTITION BY rsa.sku_id, rsa.region), rsa.created_at), 2)
                    ELSE rsa.total_orders
                END AS daily_velocity,
                rsa.created_at
            FROM regional_sales_analytics rsa
            LEFT JOIN dispatch_product dp ON dp.p_id = rsa.sku_id
            LEFT JOIN products p ON p.product_id = rsa.sku_id
            ${whereClause}
            ORDER BY rsa.created_at DESC, rsa.total_orders DESC
            LIMIT 500
            `,
            params
        );

        res.json({
            success: true,
            data: rows,
            count: rows.length,
            filters: { region: region || null, sku: sku || null },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching InventoryGPT regional demand:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/recommendations', authenticateInventoryGptToken, async (req, res) => {
    try {
        const { status } = req.query;
        const params = [];
        let query = `
            SELECT
                air.*,
                COALESCE(dp.product_name, p.product_name) AS product_name,
                COALESCE(dp.barcode, p.sku, CAST(air.sku_id AS CHAR)) AS sku
            FROM ai_inventory_recommendations air
            LEFT JOIN dispatch_product dp ON dp.p_id = air.sku_id
            LEFT JOIN products p ON p.product_id = air.sku_id
            WHERE 1 = 1
        `;

        if (status) {
            query += ' AND air.status = ?';
            params.push(status);
        }

        query += ' ORDER BY air.created_at DESC LIMIT 100';

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows, count: rows.length, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching InventoryGPT recommendations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/recommendations', authenticateInventoryGptToken, async (req, res) => {
    try {
        const {
            recommendation_type,
            sku_id,
            sku,
            source_location,
            source_warehouse,
            target_location,
            target_warehouse,
            confidence_score,
            expected_savings,
            estimated_savings,
            recommendation
        } = req.body || {};

        const recommendationText = typeof recommendation === 'string'
            ? recommendation
            : JSON.stringify(recommendation || req.body || {});

        const source = numberOrNull(source_location ?? source_warehouse);
        const target = numberOrNull(target_location ?? target_warehouse);
        const normalizedSkuId = numberOrNull(sku_id ?? sku);

        const [result] = await pool.execute(
            `INSERT INTO ai_inventory_recommendations
             (recommendation_type, sku_id, source_location, target_location, confidence_score,
              expected_savings, recommendation, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                recommendation_type || 'redistribution',
                normalizedSkuId,
                source,
                target,
                confidence_score || null,
                expected_savings || estimated_savings || null,
                recommendationText
            ]
        );

        res.status(201).json({
            success: true,
            message: 'InventoryGPT recommendation created',
            id: result.insertId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating InventoryGPT recommendation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/recommendations/:id/approve', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.execute(
            "UPDATE ai_inventory_recommendations SET status = 'accepted' WHERE id = ?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ success: false, error: 'Recommendation not found' });
        }

        res.json({ success: true, message: 'Recommendation approved' });
    } catch (error) {
        console.error('Error approving InventoryGPT recommendation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/recommendations/:id/reject', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.execute(
            "UPDATE ai_inventory_recommendations SET status = 'rejected' WHERE id = ?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ success: false, error: 'Recommendation not found' });
        }

        res.json({ success: true, message: 'Recommendation rejected' });
    } catch (error) {
        console.error('Error rejecting InventoryGPT recommendation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── STORE INTELLIGENCE ──
router.get('/store-intelligence', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.status(400).json({ error: 'code required' });

        // 1) Store details
        const [stores] = await pool.execute(
            `SELECT * FROM stores WHERE store_code = ? AND is_active = 1 LIMIT 1`,
            [code]
        );
        if (!stores.length) return res.status(404).json({ error: 'store not found' });
        const store = stores[0];

        // 2) Inventory snapshot
        const [inventory] = await pool.execute(
            `SELECT COUNT(*) as totalItems, COALESCE(SUM(stock),0) as totalStock,
                    SUM(stock*price) as inventoryValue,
                    SUM(CASE WHEN stock>0 AND stock<=10 THEN 1 ELSE 0 END) as lowStockItems,
                    SUM(CASE WHEN stock=0 THEN 1 ELSE 0 END) as outOfStockItems
             FROM store_inventory WHERE store_code = ?`,
            [code]
        );
        const inv = inventory[0];

        const [topProducts] = await pool.execute(
            `SELECT product_name, barcode, stock, price, (stock*price) as value
             FROM store_inventory WHERE store_code = ? ORDER BY stock*price DESC LIMIT 10`,
            [code]
        );

        const [lowStock] = await pool.execute(
            `SELECT product_name, barcode, stock FROM store_inventory
             WHERE store_code = ? AND stock > 0 AND stock <= 10 ORDER BY stock ASC LIMIT 10`,
            [code]
        );

        const [deadStock] = await pool.execute(
            `SELECT si.product_name, si.barcode, si.stock, si.price
             FROM store_inventory si
             LEFT JOIN store_inventory_logs sil ON si.barcode = sil.barcode AND sil.movement_type = 'SALE'
             WHERE si.store_code = ? AND si.stock > 0
             GROUP BY si.id
             HAVING COALESCE(SUM(sil.quantity),0) = 0
             LIMIT 10`,
            [code]
        );

        // 3) Billing history
        const [billingStats] = await pool.execute(
            `SELECT COUNT(*) as totalBills, COALESCE(SUM(grand_total),0) as totalRevenue,
                    COALESCE(AVG(grand_total),0) as avgBillValue,
                    MAX(created_at) as lastBillDate
             FROM bills WHERE store_code = ?`,
            [code]
        );
        const bs = billingStats[0];

        const [recentBills] = await pool.execute(
            `SELECT id, invoice_number as bill_number, created_at as bill_date,
                    grand_total as total_amount, payment_mode, customer_name
             FROM bills WHERE store_code = ? ORDER BY created_at DESC LIMIT 10`,
            [code]
        );

        const [dailySales7] = await pool.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as bills, SUM(grand_total) as revenue
             FROM bills WHERE store_code = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY date`,
            [code]
        );

        // 4) Performance score
        const stockScore = inv.totalItems > 0
            ? Math.round((1 - (inv.outOfStockItems + (inv.lowStockItems||0)*0.5) / inv.totalItems) * 40) : 0;
        const revenueScore = bs.totalRevenue > 0
            ? Math.min(30, Math.round(Math.log10(bs.totalRevenue) * 6)) : 0;
        const activityScore = bs.totalBills > 0
            ? Math.min(20, Math.round((bs.totalBills / 30) * 20)) : 0;
        const recentScore = bs.lastBillDate
            ? Math.min(10, Math.round((1 - (Date.now() - new Date(bs.lastBillDate).getTime()) / (30*24*60*60*1000)) * 10)) : 0;
        const performanceScore = Math.min(100, stockScore + revenueScore + activityScore + recentScore);

        let healthStatus = 'Excellent';
        if (performanceScore < 40) healthStatus = 'Critical';
        else if (performanceScore < 60) healthStatus = 'Needs Attention';
        else if (performanceScore < 80) healthStatus = 'Good';

        // 5) AI summary
        const lines = [];
        const activeStockPct = inv.totalItems > 0
            ? Math.round(((inv.totalItems - inv.outOfStockItems) / inv.totalItems) * 100) : 0;
        if (inv.outOfStockItems > 0) lines.push(`⚠️ ${inv.outOfStockItems} product(s) are out of stock — needs immediate restock.`);
        if (inv.lowStockItems > 0) lines.push(`📦 ${inv.lowStockItems} product(s) running low (≤10 units).`);
        if (deadStock.length > 0) {
            const dv = deadStock.reduce((s, p) => s + Number(p.price) * p.stock, 0);
            lines.push(`🪦 ${deadStock.length} dead-stock items worth ₹${dv.toLocaleString('en-IN')} — consider discounting.`);
        }
        if (bs.totalBills > 0) lines.push(`💰 ${bs.totalBills} bills totalling ₹${Number(bs.totalRevenue).toLocaleString('en-IN')} (avg ₹${Number(bs.avgBillValue).toFixed(0)}/bill).`);
        if (bs.lastBillDate) {
            const daysSince = Math.floor((Date.now() - new Date(bs.lastBillDate).getTime()) / (24*60*60*1000));
            lines.push(`📅 Last sale was ${daysSince === 0 ? 'today' : daysSince + ' day(s) ago'}.`);
        }
        lines.push(`${activeStockPct}% of inventory is in-stock. Performance score: ${performanceScore}/100 (${healthStatus}).`);

        res.json({
            success: true,
            store: {
                id: store.id, code: store.store_code, name: store.store_name,
                type: store.store_type, address: store.address, city: store.city,
                state: store.state, pincode: store.pincode, phone: store.phone,
                email: store.email, manager: store.manager_name, area_sqft: store.area_sqft,
            },
            inventory: {
                totalItems: inv.totalItems, totalStock: inv.totalStock,
                inventoryValue: inv.inventoryValue, lowStockItems: inv.lowStockItems,
                outOfStockItems: inv.outOfStockItems, topProducts, lowStock, deadStock,
            },
            billing: {
                totalBills: bs.totalBills, totalRevenue: bs.totalRevenue,
                avgBillValue: bs.avgBillValue, lastBillDate: bs.lastBillDate,
                recentBills, dailySales7,
            },
            performance: {
                score: performanceScore, status: healthStatus,
                breakdown: { stockScore, revenueScore, activityScore, recentScore },
            },
            aiSummary: lines.join('\n'),
        });
    } catch (err) {
        console.error('store-intelligence error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
