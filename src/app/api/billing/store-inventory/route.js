import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const stockFilter = searchParams.get('stock_filter') || 'all';

        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push(`(
                product_name LIKE ? OR 
                barcode LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        if (stockFilter === 'out_of_stock') {
            whereConditions.push('stock = 0');
        } else if (stockFilter === 'low_stock') {
            whereConditions.push('stock > 0 AND stock <= 10');
        } else if (stockFilter === 'in_stock') {
            whereConditions.push('stock > 10');
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get stats
        const [statsResult] = await pool.execute(`
            SELECT 
                COUNT(*) as totalProducts,
                SUM(CASE WHEN stock > 0 AND stock <= 10 THEN 1 ELSE 0 END) as lowStock,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
                SUM(stock * price) as totalValue
            FROM store_inventory
        `);

        const stats = {
            totalProducts: statsResult[0].totalProducts || 0,
            lowStock: statsResult[0].lowStock || 0,
            outOfStock: statsResult[0].outOfStock || 0,
            totalValue: parseFloat(statsResult[0].totalValue || 0)
        };

        // Get total count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM store_inventory ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get inventory
        const [inventory] = await pool.execute(
            `SELECT 
                id,
                product_name,
                barcode,
                category,
                stock,
                price,
                last_updated
            FROM store_inventory 
            ${whereClause}
            ORDER BY product_name ASC
            LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        return NextResponse.json({
            success: true,
            data: inventory,
            stats,
            total,
            page,
            limit
        });

    } catch (error) {
        console.error('Error fetching store inventory:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch store inventory',
            error: error.message 
        }, { status: 500 });
    }
}
