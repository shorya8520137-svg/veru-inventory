import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
};

// GET - Fetch all warehouses
export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        const [warehouses] = await connection.execute(`
            SELECT 
                id,
                warehouse_code,
                warehouse_name,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                manager_name,
                capacity,
                is_active,
                created_at,
                updated_at
            FROM warehouses 
            WHERE is_active = TRUE
            ORDER BY warehouse_name ASC
        `);

        await connection.end();

        return NextResponse.json({
            success: true,
            warehouses: warehouses
        });

    } catch (error) {
        console.error('Error fetching warehouses:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch warehouses',
            error: error.message 
        }, { status: 500 });
    }
}

// POST - Create new warehouse
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            warehouse_code,
            warehouse_name,
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            capacity = 0
        } = body;

        // Validate required fields
        if (!warehouse_code || !warehouse_name || !address || !city || !state || !pincode) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: warehouse_code, warehouse_name, address, city, state, pincode'
            }, { status: 400 });
        }

        const connection = await mysql.createConnection(dbConfig);

        // Check if warehouse code already exists
        const [existing] = await connection.execute(
            'SELECT id FROM warehouses WHERE warehouse_code = ?',
            [warehouse_code]
        );

        if (existing.length > 0) {
            await connection.end();
            return NextResponse.json({
                success: false,
                message: 'Warehouse code already exists'
            }, { status: 409 });
        }

        // Insert new warehouse
        const [result] = await connection.execute(`
            INSERT INTO warehouses (
                warehouse_code, warehouse_name, address, city, state, country,
                pincode, phone, email, manager_name, capacity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            warehouse_code, warehouse_name, address, city, state, country,
            pincode, phone, email, manager_name, capacity
        ]);

        await connection.end();

        return NextResponse.json({
            success: true,
            message: 'Warehouse created successfully',
            warehouse_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating warehouse:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to create warehouse',
            error: error.message 
        }, { status: 500 });
    }
}