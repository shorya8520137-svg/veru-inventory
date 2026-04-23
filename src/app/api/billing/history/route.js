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
        const limit = parseInt(searchParams.get('limit') || '15');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';

        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push(`(
                invoice_number LIKE ? OR 
                customer_name LIKE ? OR 
                customer_phone LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (status !== 'all') {
            whereConditions.push('payment_status = ?');
            queryParams.push(status);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM bills ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get bills
        const [bills] = await pool.execute(
            `SELECT 
                id,
                invoice_number,
                customer_name,
                customer_phone,
                customer_email,
                subtotal,
                discount,
                shipping,
                gst_amount,
                grand_total,
                payment_mode,
                payment_status,
                items,
                total_items,
                created_at
            FROM bills 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        return NextResponse.json({
            success: true,
            data: bills,
            total,
            page,
            limit
        });

    } catch (error) {
        console.error('Error fetching bill history:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch bill history',
            error: error.message 
        }, { status: 500 });
    }
}
