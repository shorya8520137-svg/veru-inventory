import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { session_id, user_question, bot_response, model, intent_type, render_type, response_time_ms, user_email, metadata } = body;

    if (!user_question) {
      return NextResponse.json({ success: false, error: "user_question is required" }, { status: 400 });
    }

    // Ensure table exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventorygpt_chat_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id VARCHAR(64) NOT NULL,
        user_question TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        model VARCHAR(64) DEFAULT NULL,
        intent_type VARCHAR(64) DEFAULT NULL,
        render_type VARCHAR(32) DEFAULT NULL,
        response_time_ms INT DEFAULT NULL,
        user_email VARCHAR(255) DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_chat_logs_session (session_id),
        KEY idx_chat_logs_created (created_at),
        KEY idx_chat_logs_user (user_email),
        KEY idx_chat_logs_intent (intent_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(
      `INSERT INTO inventorygpt_chat_logs
       (session_id, user_question, bot_response, model, intent_type, render_type, response_time_ms, user_email, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id || 'anonymous',
        String(user_question).slice(0, 5000),
        String(bot_response || '').slice(0, 50000),
        model || null,
        intent_type || null,
        render_type || null,
        response_time_ms || null,
        user_email || null,
        metadata || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[chat-logs] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const session_id = searchParams.get('session_id');
    const user_email = searchParams.get('user_email');
    const intent_type = searchParams.get('intent_type');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventorygpt_chat_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id VARCHAR(64) NOT NULL,
        user_question TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        model VARCHAR(64) DEFAULT NULL,
        intent_type VARCHAR(64) DEFAULT NULL,
        render_type VARCHAR(32) DEFAULT NULL,
        response_time_ms INT DEFAULT NULL,
        user_email VARCHAR(255) DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_chat_logs_session (session_id),
        KEY idx_chat_logs_created (created_at),
        KEY idx_chat_logs_user (user_email),
        KEY idx_chat_logs_intent (intent_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const params = [];
    let sql = `SELECT id, session_id, user_question, bot_response, model, intent_type,
                      render_type, response_time_ms, user_email, created_at
               FROM inventorygpt_chat_logs WHERE 1=1`;
    if (session_id) {
      sql += ' AND session_id = ?';
      params.push(session_id);
    }
    if (user_email) {
      sql += ' AND user_email = ?';
      params.push(user_email);
    }
    if (intent_type) {
      sql += ' AND intent_type = ?';
      params.push(intent_type);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM inventorygpt_chat_logs');

    return NextResponse.json({ success: true, data: rows, total: countResult[0].total, count: rows.length });
  } catch (error) {
    console.error("[chat-logs] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
