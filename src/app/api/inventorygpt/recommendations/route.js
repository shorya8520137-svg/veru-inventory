import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * InventoryGPT Recommendations API
 * Manage AI recommendations - Get, Create, Approve, Reject
 */
export async function GET(req) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        const { status } = Object.fromEntries(new URL(req.url).searchParams);
        
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authorization token required' },
                { status: 401 }
            );
        }

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

        let query = 'SELECT * FROM ai_inventory_recommendations WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const [rows] = await connection.execute(query, params);
        await connection.end();

        return NextResponse.json({
            success: true,
            data: rows,
            count: rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authorization token required' },
                { status: 401 }
            );
        }

        const tokenValid = await verifyInventoryGptToken(token);
        if (!tokenValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 403 }
            );
        }

        const {
            recommendation_type,
            agent_name,
            confidence_score,
            sku,
            source_warehouse,
            target_warehouse,
            recommended_quantity,
            estimated_savings,
            transfer_cost
        } = await req.json();

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        // Build recommendation JSON string for the `recommendation` TEXT column
        const recommendationJson = JSON.stringify({
            agent_name,
            sku,
            source_warehouse,
            target_warehouse,
            recommended_quantity,
            transfer_cost
        });

        const [result] = await connection.execute(
            `INSERT INTO ai_inventory_recommendations 
            (recommendation_type, confidence_score, sku_id, source_location, target_location, 
             expected_savings, recommendation, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [recommendation_type, confidence_score, sku, source_warehouse, target_warehouse,
             estimated_savings, recommendationJson]
        );

        await connection.end();

        return NextResponse.json({
            success: true,
            message: 'Recommendation created',
            id: result.insertId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating recommendation:', error);
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
