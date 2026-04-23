import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
};

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Get warehouse codes from database
        const [warehouses] = await connection.execute(`
            SELECT code as warehouse_code 
            FROM warehouses 
            WHERE is_active = TRUE
            ORDER BY code ASC
        `);

        await connection.end();

        // Return array of warehouse codes for backward compatibility
        const warehouseCodes = warehouses.map(w => w.warehouse_code);

        return NextResponse.json(warehouseCodes);

    } catch (error) {
        console.error('Error fetching warehouses:', error);
        
        // Fallback to hardcoded values if database fails
        const warehouses = [
            'GGM_WH',
            'BLR_WH',
            'MUM_WH',
            'AMD_WH',
            'HYD_WH',
            'DEL_WH',
            'CHN_WH',
            'KOL_WH'
        ];

        return NextResponse.json(warehouses);
    }
}
