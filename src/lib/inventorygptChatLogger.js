/**
 * InventoryGPT Chat Logger
 * Logs all user questions + bot responses to the database for monitoring.
 * Fire-and-forget — never blocks the main response.
 */

import pool from "@/lib/db";

export async function logInventoryGptChat({
  sessionId,
  question,
  answer,
  model,
  intentType,
  renderType,
  responseTimeMs,
  userEmail,
  metadata,
}) {
  try {
    // Ensure table exists (idempotent)
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
        sessionId || 'anonymous',
        String(question || '').slice(0, 5000),
        String(answer || '').slice(0, 50000),
        model || null,
        intentType || null,
        renderType || null,
        responseTimeMs || null,
        userEmail || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (e) {
    // Silently fail — logging must never break the main response
    console.warn('[ChatLogger]', e?.message);
  }
}
