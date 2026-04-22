/**
 * INVENTORY DAILY SNAPSHOT JOB
 * Runs at 11:59 PM every day
 * Aggregates inventory_ledger_base → inventory_daily_snapshot
 *
 * Setup in server.js:
 *   require('./jobs/inventorySnapshotJob');
 */

const db = require('../db/connection');

function runSnapshot() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[SnapshotJob] Running daily snapshot for ${today}`);

    const sql = `
        INSERT INTO inventory_daily_snapshot
            (tenant_id, product_code, product_name, warehouse, inventory_date,
             opening_stock, dispatch_qty, damage_qty, return_qty, recover_qty, closing_stock)
        SELECT
            l.tenant_id,
            l.barcode                                          AS product_code,
            l.product_name,
            l.location_code                                    AS warehouse,
            DATE(l.event_time)                                 AS inventory_date,
            COALESCE(SUM(CASE WHEN l.movement_type = 'OPENING' AND l.direction = 'IN'  THEN l.qty ELSE 0 END), 0) AS opening_stock,
            COALESCE(SUM(CASE WHEN l.movement_type = 'DISPATCH' AND l.direction = 'OUT' THEN l.qty ELSE 0 END), 0) AS dispatch_qty,
            COALESCE(SUM(CASE WHEN l.movement_type = 'DAMAGE'   AND l.direction = 'OUT' THEN l.qty ELSE 0 END), 0) AS damage_qty,
            COALESCE(SUM(CASE WHEN l.movement_type IN ('RETURN','RETURN_IN') AND l.direction = 'IN' THEN l.qty ELSE 0 END), 0) AS return_qty,
            COALESCE(SUM(CASE WHEN l.movement_type = 'RECOVER'  AND l.direction = 'IN'  THEN l.qty ELSE 0 END), 0) AS recover_qty,
            COALESCE(
                SUM(CASE WHEN l.direction = 'IN'  THEN l.qty ELSE 0 END) -
                SUM(CASE WHEN l.direction = 'OUT' THEN l.qty ELSE 0 END),
            0) AS closing_stock
        FROM inventory_ledger_base l
        WHERE DATE(l.event_time) = ?
        GROUP BY l.tenant_id, l.barcode, l.product_name, l.location_code, DATE(l.event_time)
        ON DUPLICATE KEY UPDATE
            dispatch_qty  = VALUES(dispatch_qty),
            damage_qty    = VALUES(damage_qty),
            return_qty    = VALUES(return_qty),
            recover_qty   = VALUES(recover_qty),
            closing_stock = VALUES(closing_stock)
    `;

    db.query(sql, [today], (err, result) => {
        if (err) {
            console.error('[SnapshotJob] Error:', err.message);
        } else {
            console.log(`[SnapshotJob] Done — ${result.affectedRows} rows upserted for ${today}`);
        }
    });
}

// Schedule: run at 23:59 every day
function scheduleSnapshot() {
    const now   = new Date();
    const next  = new Date();
    next.setHours(23, 59, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const msUntilNext = next - now;
    console.log(`[SnapshotJob] Scheduled in ${Math.round(msUntilNext / 60000)} minutes`);

    setTimeout(() => {
        runSnapshot();
        setInterval(runSnapshot, 24 * 60 * 60 * 1000); // repeat every 24h
    }, msUntilNext);
}

scheduleSnapshot();

module.exports = { runSnapshot };
