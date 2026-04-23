import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Mock data for development
const MOCK_STORES = [
    {
        id: 1,
        store_code: 'ST001',
        store_name: 'Main Store - Delhi',
        store_type: 'retail',
        address: '456 Main Street, Connaught Place',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110001',
        phone: '+91-9876543211',
        email: 'store1@insora.in',
        manager_name: 'Priya Singh',
        area_sqft: 5000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        store_code: 'ST002',
        store_name: 'Secondary Store - Mumbai',
        store_type: 'retail',
        address: '789 Marine Drive, Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400050',
        phone: '+91-9876543212',
        email: 'store2@insora.in',
        manager_name: 'Amit Patel',
        area_sqft: 4500,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

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
        // Return mock data for development when database is unreachable
        return NextResponse.json({
            success: true,
            stores: MOCK_STORES
        });
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
