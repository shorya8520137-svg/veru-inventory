import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        // Search products from store_inventory by name or barcode
        const [products] = await pool.execute(
            `SELECT 
                id as p_id,
                product_name,
                barcode,
                price,
                gst_percentage,
                category,
                stock
            FROM store_inventory 
            WHERE 
                (product_name LIKE ? OR barcode LIKE ?)
                AND stock > 0
            ORDER BY product_name
            LIMIT 20`,
            [`%${query}%`, `%${query}%`]
        );

        return NextResponse.json(products);

    } catch (error) {
        console.error('Error searching products:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to search products',
            error: error.message 
        }, { status: 500 });
    }
}
