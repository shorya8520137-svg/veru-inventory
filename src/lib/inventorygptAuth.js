import pool from './db';

/**
 * Verify an InventoryGPT API token and update usage stats
 * @param {string} token - The Bearer token to verify
 * @param {boolean} trackUsage - Whether to increment usage_count and update last_used_at
 * @returns {Promise<boolean>} - true if valid and active
 */
export async function verifyInventoryGptToken(token, trackUsage = true) {
    if (!token) return false;

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.execute(
            'SELECT id FROM inventorygpt_api_tokens WHERE token = ? AND is_active = 1 AND expires_at > NOW()',
            [token]
        );

        const valid = rows.length > 0;

        if (valid && trackUsage) {
            await connection.execute(
                'UPDATE inventorygpt_api_tokens SET usage_count = usage_count + 1, last_used_at = NOW() WHERE id = ?',
                [rows[0].id]
            );
        }

        return valid;
    } catch (error) {
        console.error('[inventorygptAuth] Token verification error:', error);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Extract Bearer token from request headers
 * @param {Request} req - Next.js request object
 * @returns {string|null} - The token or null
 */
export function extractBearerToken(req) {
    const auth = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!auth) return null;
    return auth.replace(/^Bearer\s+/i, '').trim() || null;
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Authorization token required') {
    return { success: false, error: message };
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message = 'Invalid or expired token') {
    return { success: false, error: message };
}
