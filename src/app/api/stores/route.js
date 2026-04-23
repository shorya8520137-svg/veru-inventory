import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all stores
export async function GET() {
    try {
        const connection = await pool.getConnection();
        
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

        connection.release();

        return NextResponse.json({
            success: true,
            stores: stores
        });

    } catch (error) {
        console.error('Error fetching stores:', error.message);
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

        const connection = await pool.getConnection();

        // Check if store code already exists
        const [existing] = await connection.execute(
            'SELECT id FROM stores WHERE store_code = ?',
            [store_code]
        );

        if (existing.length > 0) {
            connection.release();
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

        connection.release();

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