import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * Token revocation endpoint
 */
export async function DELETE(req, { params }) {
    try {
        const userId = req.headers.get('X-User-ID');
        const { tokenId } = params;
        
        if (!userId || !tokenId) {
            return NextResponse.json(
                { success: false, error: 'User ID and Token ID required' },
                { status: 401 }
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        const [result] = await connection.execute(
            'UPDATE inventorygpt_api_tokens SET is_active = 0 WHERE id = ? AND user_id = ?',
            [tokenId, userId]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Token not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Token revoked successfully'
        });
    } catch (error) {
        console.error('Error revoking token:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
