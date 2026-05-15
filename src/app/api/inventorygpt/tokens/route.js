import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

/**
 * InventoryGPT Token Management API
 * Handles token creation, retrieval, and revocation
 */
export async function GET(req) {
    try {
        const userId = req.headers.get('X-User-ID');
        
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 401 }
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        const [rows] = await connection.execute(
            `SELECT 
                id, 
                name, 
                description,
                token_prefix,
                is_active,
                rate_limit,
                usage_count,
                last_used_at,
                created_at,
                expires_at
            FROM inventorygpt_api_tokens 
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
            [userId]
        );

        await connection.end();

        return NextResponse.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const userId = req.headers.get('X-User-ID');
        
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 401 }
            );
        }

        const { name, description, rate_limit = 1000, expires_in_days = 90 } = await req.json();

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Token name is required' },
                { status: 400 }
            );
        }

        // Generate token
        const token = 'igpt_' + crypto.randomBytes(32).toString('hex');
        const tokenPrefix = 'igpt_' + token.substring(5, 13);
        
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        // Create token table if not exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS inventorygpt_api_tokens (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                token VARCHAR(255) NOT NULL UNIQUE,
                token_prefix VARCHAR(20),
                is_active BOOLEAN DEFAULT 1,
                rate_limit INT DEFAULT 1000,
                usage_count INT DEFAULT 0,
                last_used_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_token (token),
                INDEX idx_user (user_id),
                INDEX idx_active (is_active)
            )
        `);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires_in_days);

        const [result] = await connection.execute(
            `INSERT INTO inventorygpt_api_tokens 
            (user_id, name, description, token, token_prefix, rate_limit, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, name, description, token, tokenPrefix, rate_limit, expiresAt]
        );

        await connection.end();

        return NextResponse.json({
            success: true,
            message: 'Token created successfully',
            id: result.insertId,
            token: token, // Return full token only once
            tokenPrefix: tokenPrefix,
            expiresAt: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Error creating token:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
