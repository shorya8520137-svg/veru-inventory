import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * InventoryGPT Data Feed API - Warehouse Metrics Endpoint
 * Returns warehouse performance metrics and health scores
 */
export async function GET(req) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authorization token required' },
                { status: 401 }
            );
        }

        // Verify token
        const tokenValid = await verifyInventoryGptToken(token);
        if (!tokenValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 403 }
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        // Query warehouse performance metrics (mapped to actual DB columns)
        const query = `
            SELECT 
                wpm.id,
                wpm.warehouse_id,
                w.code as warehouse_name,
                0 as total_transfers_executed,
                0 as successful_transfers,
                0 as failed_transfers,
                wpm.fulfillment_speed as avg_fulfillment_time_days,
                wpm.dead_stock_ratio,
                0 as slow_moving_ratio,
                0 as stock_turnover_rate,
                wpm.storage_efficiency as storage_utilization_pct,
                NULL as available_capacity,
                wpm.rto_percentage as rto_risk_score,
                NULL as delay_risk_level,
                NULL as health_score,
                wpm.created_at as last_calculated,
                COALESCE(sb.cnt, 0) as total_skus,
                COALESCE(sb.total_qty, 0) as total_stock
            FROM warehouse_performance_metrics wpm
            LEFT JOIN warehouses w ON wpm.warehouse_id = w.id
            LEFT JOIN (
                SELECT warehouse, COUNT(*) as cnt, SUM(qty_available) as total_qty
                FROM stock_batches
                WHERE status = 'active'
                GROUP BY warehouse
            ) sb ON w.code = sb.warehouse
            ORDER BY wpm.created_at DESC
        `;

        const [rows] = await connection.execute(query);
        await connection.end();

        return NextResponse.json({
            success: true,
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching warehouse metrics:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

async function verifyInventoryGptToken(token) {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        const [rows] = await connection.execute(
            'SELECT id FROM inventorygpt_api_tokens WHERE token = ? AND is_active = 1 AND expires_at > NOW()',
            [token]
        );
        
        await connection.end();
        return rows.length > 0;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}
