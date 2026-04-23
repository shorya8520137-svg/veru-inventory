import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Return list of warehouse codes
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

    } catch (error) {
        console.error('Error fetching warehouses:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch warehouses',
            error: error.message 
        }, { status: 500 });
    }
}
