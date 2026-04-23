import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
};

// GET - Fetch all stores
export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [stores] = await connection.execute(`
            SELECT 
                id,
                store_code,
                store_name,
                store_type,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                manager_name,
                area_sqft,
                is_active,
                created_at,
                updated_at
            FROM stores 
            WHERE is_active = TRUE
            ORDER BY store_name ASC
        `);

        await connection.end();

        return NextResponse.json({
            success: true,
            stores: stores
        });

    } catch (error) {
        console.error('Error fetching stores:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch stores',
            error: error.message 
        }, { status: 500 });
    }
}

// POST - Create new store
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            store_code,
            store_name,
            store_type = 'retail',
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            area_sqft = 0
        } = body;

        // Validate required fields
        if (!store_code || !store_name || !address || !city || !state || !pincode) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: store_code, store_name, address, city, state, pincode'
            }, { status: 400 });
        }

        const connection = await mysql.createConnection(dbConfig);

        // Check if store code already exists
        const [existing] = await connection.execute(
            'SELECT id FROM stores WHERE store_code = ?',
            [store_code]
        );

        if (existing.length > 0) {
            await connection.end();
            return NextResponse.json({
                success: false,
                message: 'Store code already exists'
            }, { status: 409 });
        }

        // Insert new store
        const [result] = await connection.execute(`
            INSERT INTO stores (
                store_code, store_name, store_type, address, city, state, country,
                pincode, phone, email, manager_name, area_sqft
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            store_code, store_name, store_type, address, city, state, country,
            pincode, phone, email, manager_name, area_sqft
        ]);

        await connection.end();

        return NextResponse.json({
            success: true,
            message: 'Store created successfully',
            store_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating store:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to create store',
            error: error.message 
        }, { status: 500 });
    }
}