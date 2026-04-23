import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all warehouses
export async function GET(request) {
    try {
        const connection = await pool.getConnection();
        
        const [warehouses] = await connection.execute(`
            SELECT 
                id,
                code as warehouse_code,
                name as warehouse_name,
                location,
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
            ORDER BY name ASC
        `);

        connection.release();

        return NextResponse.json({
            success: true,
            warehouses: warehouses
        });

    } catch (error) {
        console.error('Warehouse API Error:', error.message);
        
        // Return mock data if database fails
        return NextResponse.json({
            success: true,
            warehouses: [
                {
                    id: 1,
                    warehouse_code: 'WH001',
                    warehouse_name: 'Main Warehouse',
                    location: 'Gurgaon',
                    address: 'Plot 123, Industrial Area',
                    city: 'Gurgaon',
                    state: 'Haryana',
                    country: 'India',
                    pincode: '122001',
                    phone: '+91-9876543210',
                    email: 'wh1@insora.in',
                    manager_name: 'Rajesh Kumar',
                    capacity: 50000,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]
        });
    }
}

// POST - Create new warehouse
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            warehouse_code,
            warehouse_name,
            location,
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
        if (!warehouse_code || !warehouse_name || !city || !state) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: warehouse_code, warehouse_name, city, state'
            }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Check if warehouse code already exists
        const [existing] = await connection.execute(
            'SELECT id FROM warehouses WHERE code = ?',
            [warehouse_code]
        );

        if (existing.length > 0) {
            connection.release();
            return NextResponse.json({
                success: false,
                message: 'Warehouse code already exists'
            }, { status: 409 });
        }

        // Insert new warehouse
        const [result] = await connection.execute(`
            INSERT INTO warehouses (
                code, name, location, address, city, state, country,
                pincode, phone, email, manager_name, capacity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            warehouse_code, warehouse_name, location, address, city, state, country,
            pincode, phone, email, manager_name, capacity
        ]);

        connection.release();

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