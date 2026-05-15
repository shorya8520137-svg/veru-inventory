import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * InventoryGPT Data Feed API - Regional Demand Endpoint
 * Returns regional sales analytics and demand signals
 */
export async function GET(req) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        const { region, sku } = Object.fromEntries(new URL(req.url).searchParams);
        
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

        // Query regional sales analytics (mapped to actual DB columns)
        let query = `
            SELECT 
                rsa.id,
                rsa.created_at as analysis_date,
                rsa.region,
                rsa.warehouse_id,
                rsa.sku_id as sku,
                NULL as product_name,
                rsa.total_orders as total_units_sold,
                rsa.total_revenue,
                rsa.avg_shipping_cost as avg_selling_price,
                0 as daily_velocity,
                'stable' as velocity_trend,
                rsa.out_of_stock_incidents as stockout_incidents,
                rsa.marketplace as fulfillment_source,
                0 as avg_delivery_days,
                rsa.created_at
            FROM regional_sales_analytics rsa
            WHERE rsa.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `;

        const params = [];

        if (region) {
            query += ' AND rsa.region = ?';
            params.push(region);
        }

        if (sku) {
            query += ' AND rsa.sku = ?';
            params.push(sku);
        }

        query += ' ORDER BY rsa.analysis_date DESC, rsa.daily_velocity DESC LIMIT 500';

        const [rows] = await connection.execute(query, params);
        await connection.end();

        return NextResponse.json({
            success: true,
            data: rows,
            count: rows.length,
            filters: { region, sku },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching regional demand:', error);
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
