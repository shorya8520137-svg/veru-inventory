import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * InventoryGPT Data Feed API - Inventory State Endpoint
 * Returns current inventory state across all warehouses
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

        // Query current inventory state from stock_batches (the actual live table)
        const query = `
            SELECT 
                sb.id,
                sb.barcode as sku,
                sb.product_name,
                sb.warehouse,
                sb.qty_available as stock,
                0 as qty_reserved,
                sb.qty_available as sellable_stock,
                NULL as stock_category,
                sb.created_at as last_verified_at,
                w.name as warehouse_name,
                NULL as health_score,
                NULL as dead_stock_ratio,
                0 as price,
                0 as margin_percentage
            FROM stock_batches sb
            LEFT JOIN warehouses w ON sb.warehouse = w.code
            WHERE sb.status = 'active'
            ORDER BY sb.created_at DESC
            LIMIT 1000
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
        console.error('Error fetching inventory state:', error);
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
